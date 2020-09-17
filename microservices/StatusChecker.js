const {
    GET_STATUS,
    GET_BALANCE,
    BALANCE_TRANSFER,
    NEW_MARKET_ORDER,
    MAKE_WITHDRAW,
    SUCCESS_SMALL_AMOUNT,
    SUCCESS,
    CANCEL,
    WAITING_FOR_PAYMENT,
    PAID,
    TO_TRADE,
    TO_MAIN,
    IN_PROGRESS,
    GET_TX_INFO,
} = require('../constants');

class StatusChecker {
    constructor(db, fetchToCoinsbit, fetchCurrencyPairRate, sendMessageToId){
        this.counter = 0;
        this.db = db;
        this.fetchToCoinsbit = fetchToCoinsbit;
        this.fetchCurrencyPairRate = fetchCurrencyPairRate;
        this.sendMessageToId = sendMessageToId;
        // this.getCoinsbitAdminPlcBalance()
        // this.getInvoiceStatus('23915f49-cc44-48cc-a03d-13fc94742c20')
    }

    succesStatusChecher(){
        setInterval(async () => {
            const allOrders = await this.db.getAllOrdersByStatus(IN_PROGRESS)
            for (const element of allOrders) {
                const invoiceStatus = await this.getInvoiceStatus(element.invoiceId)
                if (invoiceStatus.result.status === SUCCESS || invoiceStatus.result.status === SUCCESS_SMALL_AMOUNT) { 
                    await this.db.changePaidCurrencyAmount(element.invoiceId, invoiceStatus.result.actualAmount)
                    await this.db.changeInvoiceStatus(invoiceStatus.result.invoice, PAID)
                    this.sendMessageToId(element.userId, `Your payment was accepted, we will send your PLC as soon as posible. You will receive notification about deposit.`) 
                } else if (invoiceStatus.result.status === CANCEL) {
                    console.log(`status CANCELED: ${invoiceStatus.result.status}`)
                    // change status in our db
                    this.db.changeInvoiceStatus(invoiceStatus.result.invoice, CANCEL)
                    this.sendMessageToId(element.userId, `Ooops, something went wrong! Your payment was not accepted. \nThis order was closed! If you pay but don't recieve your PLC in 3 hours - please contact *support@platincoin.com* \n*Thanks for being with Platincoin!*`)  /// напмсать сюда сообщение ошибку!!!!!!!!!!!!
                } else continue;
            };
        }, 5000);
    }

    paidStatusChecher(){
        setInterval(async () => {
            const allPaidOrders = await this.db.getAllOrdersByStatus(PAID)
            console.log(`-=-=-=-=--=-=-=-=-=-=-=-=-====-=-=`)
            console.log(allPaidOrders)
            console.log(`-=-=-=-=--=-=-=-=-=-=-=-=-=-===-=-=`)
            for (const element of allPaidOrders) {
                const invoiceStatus = await this.getInvoiceStatus(element.invoiceId)
                if (invoiceStatus.success !== true) continue
                const adminPlcBalance = await this.getCoinsbitAdminPlcBalance()
                let paidCurrencyAmount = await this.db.getOrderByInvoiceId(element.invoiceId)
                paidCurrencyAmount = paidCurrencyAmount[0].paidCurrencyAmount
                if(paidCurrencyAmount > 0) {
                    let plcToSend = await this.calculatePlcAmount(invoiceStatus.result.currency, paidCurrencyAmount)
                    if(plcToSend && plcToSend < 2) {
                        this.sendMessageToId(element.userId, `Minimum withdrawal limit reached. Please contact support team to solve this problem on support@platincoin.com`) /// Вывесте сообщение об успеху с хэшем
                        await this.db.changeInvoiceStatus(invoiceStatus.result.invoice, CANCEL)
                        continue;
                    }
                    // console.log(`plcToSend  ----------------------- ${plcToSend}`)
                    // console.log(`paidCurrencyAmount  ----------------------- ${paidCurrencyAmount}`)
                    plcToSend = plcToSend.toFixed(4)
                    if(+adminPlcBalance >= +plcToSend) {
                        console.log(`adminPlcBalance >= +plcToSend`)
                        this.sendMessageToId(350985285, `PLC on admin balance is sufficient, sending PLC to user`) 
                        await this.sendPlcToUser(invoiceStatus, plcToSend, element.userAddress)
                        //посчитать в плц
                    }
                    else if (+adminPlcBalance < +plcToSend) {
                        console.log(`adminPlcBalance < +plcToSend`)
                        this.sendMessageToId(350985285, `PLC on admin balance not enough, creating new market order`) 
                        let balanceToTradeStatus = await this.db.getOrderByInvoiceId(element.invoiceId)
                        balanceToTradeStatus = balanceToTradeStatus[0].balanceToTradeStatus
                        if(!balanceToTradeStatus) {
                            var balanceToTrade = await this.balanceTransfer(invoiceStatus.result.currency, invoiceStatus.result.actualAmount, TO_TRADE)  //invoiceStatus.result.amount, it's USDT for example
                            console.log(`balanceToTrade`)
                            console.log(balanceToTrade)
                            console.log(`balanceToTrade`)
                        }
                        if(balanceToTradeStatus || (balanceToTrade && balanceToTrade.success)) {
                            // console.log(`step1`)
                            await this.db.changeBalanceToTradeStatus(element.invoiceId, true)
                            let marketOrderStatus = await this.db.getOrderByInvoiceId(element.invoiceId)
                            marketOrderStatus = marketOrderStatus[0].newMarketOrderStatus
                            if(!marketOrderStatus) {
                                var newMarketOrder = await this.newMarketOrder(invoiceStatus.result.currency, invoiceStatus.result.actualAmount)  //invoiceStatus.result.amount, it's USDT for example
                            }
                            if(marketOrderStatus || (newMarketOrder && newMarketOrder.success)) {
                            // console.log(`step2`)
                                await this.db.changeNewMarketOrderStatus(element.invoiceId, true)
                                let balanceToMainStatus = await this.db.getOrderByInvoiceId(element.invoiceId)
                                balanceToMainStatus = balanceToMainStatus[0].balanceToMainStatus
                                if(!balanceToMainStatus) {
                                    var balanceToMain = await this.balanceTransfer('PLC', plcToSend, TO_MAIN)  // newMarketOrder.result.dealStock It's PLC
                                }
                                if(balanceToMainStatus || (balanceToMain && balanceToMain.success)) {
                                    // console.log(`step3`)
                                    await this.db.changeBalanceToMainStatus(element.invoiceId, true)//.then(res=>console.log(res))
                                    await this.sendPlcToUser(invoiceStatus, plcToSend, element.userAddress)
                                    this.sendMessageToId(350985285, `Sending PLC to user after traiding`) 

                                }
                            }
                        }
                    }
                }
            };
        }, 15000);
    }
    statusPlcChecher(){
        setInterval(async () => {
            const allOrdersWithCoinsbitTxId = await this.db.getAllOrdersByStatus(WAITING_FOR_PAYMENT)
            // console.log(allOrdersWithCoinsbitTxId)
            for (const element of allOrdersWithCoinsbitTxId) {
                const data = {
                    "txid": element.internalCoinsbitTxId,
                    "request": "/api/v1/payment/transaction",
                    "nonce": (Date.now()).toFixed()
                }
                // console.log(data)
                const PlctxStatus = await this.fetchToCoinsbit(data, GET_TX_INFO)
                // console.log(PlctxStatus)
                if(PlctxStatus.result && PlctxStatus.result.txHash){
                    this.db.changeInvoiceStatus(element.invoiceId, SUCCESS)
                    this.db.changeSendPLCStatus(element.invoiceId, SUCCESS)
                    this.db.addTxHash(element.invoiceId, PlctxStatus.result.txHash)
                    this.sendMessageToId(element.userId, `Congratulations! Your payment successfully accepted. Your PLC was sent to your wallet. You can check it by **[hash](https://platincoin.info/#/tx/${PlctxStatus.result.txHash})** \n\n*Thanks for being with Platincoin!*`) /// Вывесте сообщение об успеху с хэшем
                }
            };
        }, 60000);
    }

   async getInvoiceStatus(invoiceId) {  //ticker here not PLC
        const txData = {
            "invoice": invoiceId,
            "request": "/api/v1/merchant/invoice_status",
            "nonce": (Date.now()).toFixed()
        }
        const invoice = await this.fetchToCoinsbit(txData, GET_STATUS)
        return invoice
    }
   async sendPlcToUser(invoiceStatus, amountPLC, userAddress) { 
        const sendTx = await this.makeWithdraw(amountPLC, userAddress)
        // const sendTx = {}
        console.log(`send plc to user -=-=-=-=-=-=-=-=-=-=-= send plc to user ${amountPLC}`)
        console.log(`send plc to user -=-=-=-=-=-=-=-=-=-=-= send plc to user ${amountPLC}`)
        console.log(`send plc to user -=-=-=-=-=-=-=-=-=-=-= send plc to user ${amountPLC}`)
        console.log(`send plc to user -=-=-=-=-=-=-=-=-=-=-= send plc to user ${amountPLC}`)
        console.log(`send plc to user -=-=-=-=-=-=-=-=-=-=-= send plc to user ${amountPLC}`)
        // console.log(amountPLC)
        // this.db.changeInvoiceStatus(invoiceStatus.result.invoice, WAITING_FOR_PAYMENT)
        // console.log(` send plc to user -=-=-=-=-=-=-=-=-=-=-= send plc to user`)
        if(sendTx.hasOwnProperty('result') && sendTx.success === true) {  
            if(sendTx.result.hasOwnProperty('txid')){
                console.log(`sendTxSuccess`)
                this.sendMessageToId(350985285, `PLC was successfully sended`) 
                this.counter = 0
                // changed status in our db
                await this.db.changeInvoiceStatus(invoiceStatus.result.invoice, WAITING_FOR_PAYMENT)
                await this.db.addInternalCoinsbitTxId(invoiceStatus.result.invoice, sendTx.result.txid)
            }           
        } else {
            console.log('INTERNAL SERVER PASHA ERROR', sendTx) 
            if(this.counter < 1){
                this.sendMessageToId(350985285, `*ERROR!* ${JSON.stringify(sendTx.message)}`)  //\n*Invoice:* ${element.invoiceId} но у меня показівается только одго сообщение и в этом пока нет смысла
                this.counter++
            }
        }
    }
   async getCoinsbitAdminPlcBalance() {  //ticker here not PLC
        const txData = {
            // "invoice": invoiceId,
            "request": "/api/v1/payment/balances",
            "nonce": (Date.now()).toFixed()
        }
        let balance = await this.fetchToCoinsbit(txData, GET_BALANCE) //!!!!!!!
        balance = balance.result.PLC.main_balance
        // console.log(balance)
        return balance
    }

   async balanceTransfer(ticker, amountFormInvoice, direction) {  //ticker here not PLC
        const txData = {
            "ticker": ticker,
            "amount": amountFormInvoice.toString(), 
            "direction": direction,
            "request": "/api/v1/payment/balancetransfer",
            "nonce": (Date.now()/1000).toFixed(),
        }
        const sendTx = await this.fetchToCoinsbit(txData, BALANCE_TRANSFER) //!!!!!!!
        return sendTx
    }

   async newMarketOrder(ticker, amountFormInvoice) {  //ticker here not PLC
        const txData = {
            "market": `PLC_${ticker}`,
            "direction": "buy",
            "amount": amountFormInvoice.toString(), 
            "request": "/api/v1/payment/newmarketorder",
            "nonce": (Date.now()/1000).toFixed(),
        }
        const sendTx = await this.fetchToCoinsbit(txData, NEW_MARKET_ORDER) //!!!!!!!
        return sendTx
    }

   async makeWithdraw(amountPLC, userAddress) {
        const txData = {
            "ticker": "PLC",
            "amount": amountPLC, 
            "address": userAddress, 
            "request": "/api/v1/payment/makewithdraw",
            "nonce": (Date.now()/1000).toFixed(),
        }
        const sendTx = await this.fetchToCoinsbit(txData, MAKE_WITHDRAW)
        return sendTx
    }
   async calculatePlcAmount(currency, amount) {
       if(amount != 0) {
        const pricePlcToCurrency = await this.fetchCurrencyPairRate(currency)  // if I send USD, I will get 5.47
        const plcAmount = amount/+pricePlcToCurrency
        return plcAmount // for example, if currency = EUR, amount = 10, plcAmount will be 2
       } else throw Error(`amount to calculate = 0 `)
    }
    
}
//
module.exports = StatusChecker;