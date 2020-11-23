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
    ADMIN1_ADDRESS,
} = require('../constants');

class StatusChecker {
    constructor(db, fetchToCoinsbit, fetchCurrencyPairRate, sendMessageToId) {
        this.counter = 0;
        this.db = db;
        this.fetchToCoinsbit = fetchToCoinsbit;
        this.fetchCurrencyPairRate = fetchCurrencyPairRate;
        this.sendMessageToId = sendMessageToId;
        // this.getInvoiceStatus('c55345a1-0ebf-4c0f-8477-604ce017a6fe')
    }

    succesStatusChecker() {
        try {
            setInterval(async () => {
                const allOrders = await this.db.getAllOrdersByStatus(IN_PROGRESS)
                for (const element of allOrders) {
                    const invoiceStatus = await this.getInvoiceStatus(element.invoiceId)
                    if ((invoiceStatus && invoiceStatus.result && invoiceStatus.result.status === SUCCESS) || (invoiceStatus && invoiceStatus.result && invoiceStatus.result.status === SUCCESS_SMALL_AMOUNT)) {
                        await this.db.changePaidCurrencyAmount(element.invoiceId, invoiceStatus.result.actualAmount)
                        await this.db.changeInvoiceStatus(invoiceStatus.result.invoice, PAID)
                        this.sendMessageToId(element.userId, `Your payment was accepted, we will send your PLC as soon as posible. You will receive notification about deposit.`)
                    } else if (invoiceStatus && invoiceStatus.result.status === CANCEL) {
                        console.log(`status CANCELED: ${invoiceStatus.result.status}`)
                        this.db.changeInvoiceStatus(invoiceStatus.result.invoice, CANCEL)
                        this.sendMessageToId(element.userId, `Ooops, something went wrong! Your payment was not accepted. \nThis order was closed! If you pay but don't recieve your PLC in 3 hours - please contact *support@platincoin.com* \n*Thanks for being with Platincoin!*`)  /// напмсать сюда сообщение ошибку!!!!!!!!!!!!
                    } else continue;
                };
            }, 5000);
        } catch (error) {
            console.error(error)
        }
    }

    statusPlcChecher() {
        try {
            setInterval(async () => {
                const allOrdersWithCoinsbitTxId = await this.db.getAllOrdersByStatus(WAITING_FOR_PAYMENT)
                for (const element of allOrdersWithCoinsbitTxId) {
                    const sendPlcStatus = await this.getPlcTransactionStatus(element.internalCoinsbitTxId)
                    if (sendPlcStatus && sendPlcStatus.result && sendPlcStatus.result.txHash) {
                        this.db.changeInvoiceStatus(element.invoiceId, SUCCESS)
                        this.db.changeSendPLCStatus(element.invoiceId, SUCCESS)
                        this.db.addTxHash(element.invoiceId, sendPlcStatus.result.txHash)
                        this.sendMessageToId(element.userId, `Congratulations! Your payment successfully accepted. Your PLC was sent to your wallet. You can check it by **[hash](https://platincoin.info/#/tx/${sendPlcStatus.result.txHash})** \n\n*Thanks for being with Platincoin!*`) /// Вывесте сообщение об успеху с хэшем
                    }
                };
            }, 20000);
        } catch (error) {
            console.error(error)
        }
    }

    paidStatusChecher() {
        try {
            setInterval(async () => {
                const allPaidOrders = await this.db.getAllOrdersByStatus(PAID)
                for (const element of allPaidOrders) {
                    const invoiceStatus = await this.getInvoiceStatus(element.invoiceId)
                    if (invoiceStatus.success !== true) continue
                    const adminPlcBalance = await this.getCoinsbitAdminPlcBalance()
                    const order = await this.db.getOrderByInvoiceId(element.invoiceId)
                    let paidCurrencyAmount = order[0].paidCurrencyAmount
                    if (paidCurrencyAmount === 0) continue
                    let plcToSend = await this.calculatePlcAmount(invoiceStatus.result.currency, paidCurrencyAmount)
                    plcToSend = plcToSend.toFixed(4)
                    if (plcToSend && plcToSend < 2) {
                        this.sendMessageToId(element.userId, `Minimum withdrawal limit reached. Please contact support team to solve this problem on support@platincoin.com`)
                        await this.db.changeInvoiceStatus(invoiceStatus.result.invoice, CANCEL)
                        continue;
                    }
                    else if (+adminPlcBalance >= +plcToSend) {
                        await this.sendPlcToUser(invoiceStatus, plcToSend, element.userAddress)
                        this.sendMessageToId(ADMIN1_ADDRESS, `PLC on admin balance is sufficient, sending PLC to user`)
                    }
                    else if (+adminPlcBalance < +plcToSend) {
                        let trade = await this.trade(element, invoiceStatus, plcToSend)
                        if (trade) {
                            this.sendMessageToId(ADMIN1_ADDRESS, `Sending PLC to user after traiding success`)
                        }
                    }
                };
            }, 30000);
        } catch (error) {
            console.error(error)
        }
    }

    async trade(element, invoiceStatus, plcToSend) {
        try {
            this.sendMessageToId(ADMIN1_ADDRESS, `PLC on admin balance not enough, creating new market order`)
            const balanceToTrade = await this.sendBalanceToTrade(element, invoiceStatus)
            if (balanceToTrade) {
                const newMarketOrder = await this.createNewMarketOrder(element, invoiceStatus)
                if (newMarketOrder) {
                    const balanceToMain = await this.sendBalanceToMain(element, plcToSend)
                    if (balanceToMain) {
                        let sendPlc = await this.sendPlcToUser(invoiceStatus, plcToSend, element.userAddress)
                        return sendPlc
                    }
                }
            }
        } catch (error) {
            this.sendMessageToId(ADMIN1_ADDRESS, `ERROR while traiding`)
        }
    }

    async sendBalanceToTrade(element, invoiceStatus) {
        try {
            const order = await this.db.getOrderByInvoiceId(element.invoiceId)
            let balanceToTradeStatus = order[0].balanceToTradeStatus
            if (!balanceToTradeStatus) {
                var balanceToTrade = await this.balanceTransfer(invoiceStatus.result.currency, element.paidCurrencyAmount, TO_TRADE)  //invoiceStatus.result.amount, it's USDT for example
                this.sendMessageToId(ADMIN1_ADDRESS, `Balance to trade function result = ${balanceToTrade.success}`)
            }
            if (balanceToTradeStatus || (balanceToTrade && balanceToTrade.success)) {
                await this.db.changeBalanceToTradeStatus(element.invoiceId, true)
                return true
            }
            return balanceToTradeStatus
        } catch (error) {
            this.sendMessageToId(ADMIN1_ADDRESS, `Error while sending balance to trade`)
        }
    }

    async createNewMarketOrder(element, invoiceStatus) {
        try {
            const order = await this.db.getOrderByInvoiceId(element.invoiceId)
            let marketOrderStatus = order[0].newMarketOrderStatus
            if (!marketOrderStatus) {
                var newMarketOrder = await this.newMarketOrder(invoiceStatus.result.currency, element.paidCurrencyAmount)  //invoiceStatus.result.currency, it's USDT for example
                this.sendMessageToId(ADMIN1_ADDRESS, `New market order function result = ${newMarketOrder.success}`)
                if (newMarketOrder && newMarketOrder.success) this.sendMessageToId(ADMIN1_ADDRESS, `new market order function = true`)
            }
            if (marketOrderStatus || (newMarketOrder && newMarketOrder.success)) {
                console.log(`SUCCES CREATING NEW MARKET ORDER, CHANGED STATUS IN DB`)
                await this.db.changeNewMarketOrderStatus(element.invoiceId, true).then(res => console.log(res))
                return true
            }
            return marketOrderStatus
        } catch (error) {
            this.sendMessageToId(ADMIN1_ADDRESS, `Error while creating new market order`)
        }
    }

    async sendBalanceToMain(element, plcToSend) {
        try {
            const order = await this.db.getOrderByInvoiceId(element.invoiceId)
            let balanceToMainStatus = order[0].balanceToMainStatus
            if (!balanceToMainStatus) {
                var balanceToMain = await this.balanceTransfer('PLC', plcToSend, TO_MAIN)
                if (balanceToMain && balanceToMain.success) this.sendMessageToId(ADMIN1_ADDRESS, `Balance to main function result= true`)
            }
            if (balanceToMainStatus || (balanceToMain && balanceToMain.success)) {
                await this.db.changeBalanceToMainStatus(element.invoiceId, true)//.then(res=>console.log(res))
                return true
            }
            return balanceToMainStatus
        } catch (error) {
            this.sendMessageToId(ADMIN1_ADDRESS, `Error While sending PLC balance to main`)
        }
    }

    async sendPlcToUser(invoiceStatus, amountPLC, userAddress) {
        try {
            const sendTx = await this.makeWithdraw(amountPLC, userAddress)
            if (sendTx.hasOwnProperty('result') && sendTx.success === true) {
                if (sendTx.result.hasOwnProperty('txid')) {
                    this.sendMessageToId(ADMIN1_ADDRESS, `PLC was successfully sended`)
                    this.counter = 0
                    console.log(`sendTx.result.txid = `, sendTx.result.txid)
                    await this.db.changeFinalCurrencyAmount(invoiceStatus.result.invoice, amountPLC)
                    await this.db.addInternalCoinsbitTxId(invoiceStatus.result.invoice, sendTx.result.txid)
                    await this.db.changeInvoiceStatus(invoiceStatus.result.invoice, WAITING_FOR_PAYMENT)
                    return sendTx.result.txid
                }
            } else {
                console.log('INTERNAL SERVER PASHA ERROR', sendTx)
                if (this.counter < 1) {
                    this.sendMessageToId(ADMIN1_ADDRESS, `*ERROR!* ${JSON.stringify(sendTx.message)}`)
                    this.counter++
                }
                return false
            }
        } catch (error) {
            this.sendMessageToId(ADMIN1_ADDRESS, `Error While sending PLC to user`)
        }
    }

    async getInvoiceStatus(invoiceId) {
        try {
            const txData = {
                "invoice": invoiceId,
                "request": "/api/v1/merchant/invoice_status",
                "nonce": (Date.now()).toFixed()
            }
            const invoice = await this.fetchToCoinsbit(txData, GET_STATUS)
            // console.log(invoice)
            return invoice
        } catch (error) {
            console.error(error)
        }
    }
    async getPlcTransactionStatus(internalCoinsbitTxId) {
        try {
            const data = {
                "txid": internalCoinsbitTxId,
                "request": "/api/v1/payment/transaction",
                "nonce": (Date.now()).toFixed()
            }
            const plctxStatus = await this.fetchToCoinsbit(data, GET_TX_INFO)
            return plctxStatus
        } catch (error) {
            console.log(`error in getPlcTransactionStatus coinsbit txId ${internalCoinsbitTxId}`)
            // return false
        }
    }

    async getCoinsbitAdminPlcBalance() {
        try {
            const txData = {
                "request": "/api/v1/payment/balances",
                "nonce": (Date.now()).toFixed()
            }
            let balance = await this.fetchToCoinsbit(txData, GET_BALANCE)
            balance = balance.result.PLC.main_balance
            // console.log(balance)
            return balance
        } catch (error) {
            console.error(error)
        }
    }

    async balanceTransfer(ticker, amountFormInvoice, direction) {
        try {
            const txData = {
                "ticker": ticker,
                "amount": amountFormInvoice.toString(),
                "direction": direction,
                "request": "/api/v1/payment/balancetransfer",
                "nonce": (Date.now() / 1000).toFixed(),
            }
            const balanceTo = await this.fetchToCoinsbit(txData, BALANCE_TRANSFER)
            return balanceTo
        } catch (error) {
            console.error(error)
        }
    }

    async newMarketOrder(ticker, amountFormInvoice) {
        try {
            const txData = {
                "market": `PLC_${ticker}`,
                "direction": "buy",
                "amount": amountFormInvoice.toString(),
                "request": "/api/v1/payment/newmarketorder",
                "nonce": (Date.now() / 1000).toFixed(),
            }
            const newOrder = await this.fetchToCoinsbit(txData, NEW_MARKET_ORDER)
            return newOrder
        } catch (error) {
            console.error(error)
        }
    }

    async makeWithdraw(amountPLC, userAddress) {
        try {
            const txData = {
                "ticker": "PLC",
                "amount": amountPLC,
                "address": userAddress,
                "request": "/api/v1/payment/makewithdraw",
                "nonce": (Date.now() / 1000).toFixed(),
            }
            const sendTx = await this.fetchToCoinsbit(txData, MAKE_WITHDRAW)
            return sendTx
        } catch (error) {
            console.error(error)
        }
    }

    async calculatePlcAmount(currency, amount) {
        try {
            if (amount != 0) {
                const pricePlcToCurrency = await this.fetchCurrencyPairRate(currency)  // if I send USD, I will get 5.47
                const plcAmount = amount / +pricePlcToCurrency
                return plcAmount // for example, if currency = EUR, amount = 10, plcAmount will be 2
            } else throw Error(`amount to calculate = 0 `)
        } catch (error) {
            throw Error(`amount to calculate = 0 `)
        }
    }

}
//
module.exports = StatusChecker;