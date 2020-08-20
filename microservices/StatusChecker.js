const {
    GET_STATUS,
    BALANCE_TRANSFER,
    NEW_MARKET_ORDER,
    MAKE_WITHDRAW,
    SUCCESS,
    CANCEL,
    WAITING_FOR_PAYMENT,
    TO_TRADE,
    TO_MAIN,
    IN_PROGRESS,
    GET_TX_INFO,
} = require('../constants');

class StatusChecker {
    constructor(db, fetchToCoinsbit, sendMessageToId){
        this.counter = 0;
        this.db = db;
        this.fetchToCoinsbit = fetchToCoinsbit;
        this.sendMessageToId = sendMessageToId;
    }

    statusInvoiceChecher(){
        setInterval(async () => {
            const allOrders = await this.db.getAllOrdersByStatus(IN_PROGRESS)
            for (const element of allOrders) {
                const invoiceStatus = await this.getInvoiceStatus(element.invoiceId)
                if (invoiceStatus.result.status === SUCCESS) { 
                // if (true) { 
                    let balanceToTradeStatus = await this.db.getOrderByInvoiceId(element.invoiceId)
                    balanceToTradeStatus = balanceToTradeStatus[0].balanceToTradeStatus
                    if(!balanceToTradeStatus) {
                        var balanceToTrade = await this.balanceTransfer(invoiceStatus.result.currency, invoiceStatus.result.amount, TO_TRADE)  //invoiceStatus.result.amount, it's USDT for example
                    }
                    if(balanceToTradeStatus || (balanceToTrade && balanceToTrade.success)) {
                        console.log(`step1`)
                        await this.db.changeBalanceToTradeStatus(element.invoiceId, true)
                        let marketOrderStatus = await this.db.getOrderByInvoiceId(element.invoiceId)
                        marketOrderStatus = marketOrderStatus[0].newMarketOrderStatus
                        if(!marketOrderStatus) {
                            var newMarketOrder = await this.newMarketOrder(invoiceStatus.result.currency, invoiceStatus.result.amount)  //invoiceStatus.result.amount, it's USDT for example
                        }
                        if(marketOrderStatus || (newMarketOrder && newMarketOrder.success)) {
                        console.log(`step2`)
                            await this.db.changeNewMarketOrderStatus(element.invoiceId, true)
                            let balanceToMainStatus = await this.db.getOrderByInvoiceId(element.invoiceId)
                            balanceToMainStatus = balanceToMainStatus[0].balanceToMainStatus
                            if(!balanceToMainStatus) {
                                var balanceToMain = await this.balanceTransfer(invoiceStatus.result.currency, element.amountPLC, TO_MAIN)  // newMarketOrder.result.dealStock It's PLC
                            }
                            if(balanceToMainStatus || (balanceToMain && balanceToMain.success)) {
                            console.log(`step3`)
                                await this.db.changeBalanceToMainStatus(element.invoiceId, true)
                                const sendTx = await this.makeWithdraw(element.amountPLC, element.userAddress)
                                if(sendTx.hasOwnProperty('result') && sendTx.success === true) {  
                                    if(sendTx.result.hasOwnProperty('txid')){
                                        console.log(`sendTxSuccess`)
                                        this.sendMessageToId(element.userId, `Your payment was accepted, we will send your PLC as soon as posible. You will receive notification about deposit.`) 
                                        this.counter = 0
                                        // changed status in our db
                                        this.db.changeInvoiceStatus(invoiceStatus.result.invoice, WAITING_FOR_PAYMENT)
                                        this.db.addInternalCoinsbitTxId(invoiceStatus.result.invoice, sendTx.result.txid)
                                    }           
                                } else {
                                    console.log('INTERNAL SERVER PASHA ERROR', sendTx.message) 
                                    if(this.counter < 1){
                                        this.sendMessageToId(350985285, `*ERROR!* ${JSON.stringify(sendTx.message)}`)  //\n*Invoice:* ${element.invoiceId} но у меня показівается только одго сообщение и в этом пока нет смысла
                                        this.counter++
                                    }
                                }
                            }
                        }
                    }
                } else if (invoiceStatus.result.status === CANCEL) {
                    console.log(`status CANCEL: ${invoiceStatus.result.status}`)
                    // change status in our db
                    this.db.changeInvoiceStatus(invoiceStatus.result.invoice, CANCEL)
                    this.sendMessageToId(element.userId, `Ooops, something went wrong! Your payment was not accepted. \nThis order was closed! If you sent money but, see this message please, contact support@platincoin.com \n*Thanks for being with Platincoin!*`)  /// напмсать сюда сообщение ошибку!!!!!!!!!!!!
                } else continue;
            };
        }, 7000);
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
                if(PlctxStatus.result.txHash){
                    this.db.changeInvoiceStatus(element.invoiceId, SUCCESS)
                    this.db.changeSendPLCStatus(element.invoiceId, SUCCESS)
                    this.db.addTxHash(element.invoiceId, PlctxStatus.result.txHash)
                    this.sendMessageToId(element.userId, `congratulations your payment successfully accepted. Your PLC send to your wallet **[https://platincoin.info/#/tx/${PlctxStatus.result.txHash}](https://platincoin.info/#/tx/${PlctxStatus.result.txHash})** \n\n*Thanks for being with Platincoin!*`) /// Вывесте сообщение об успеху с хэшем
                }
            };
        }, 30000);
    }

   async getInvoiceStatus(invoiceId) {  
        const data = {
            "invoice": invoiceId,
            "request": "/api/v1/merchant/invoice_status",
            "nonce": (Date.now()).toFixed()
        }
        const invoiceStatus = await this.fetchToCoinsbit(data, GET_STATUS)
        return invoiceStatus
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
    
}
//
module.exports = StatusChecker;