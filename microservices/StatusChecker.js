const {
    GET_STATUS,
    MAKE_WITHDRAW,
    SUCCESS,
    CANCEL,
    WAITING_FOR_PAYMENT,
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
                // console.log(element.invoiceId)
                const data = {
                    "invoice": element.invoiceId,
                    "request": "/api/v1/merchant/invoice_status",
                    "nonce": (Date.now()).toFixed()
                }
                const result = await this.fetchToCoinsbit(data, GET_STATUS)
                // console.log(result)
                if (result.result.status === SUCCESS) { 
                    this.db.changeInvoiceStatus(result.result.invoice, WAITING_FOR_PAYMENT)
                    // send tx to user
                    const txData = {
                        "ticker": "PLC",
                        "amount": element.amountPLC, 
                        "address": element.userAddress, 
                        "request": "/api/v1/payment/makewithdraw",
                        "nonce": (Date.now()/1000).toFixed(),
                    }
                    const sendTx = await this.fetchToCoinsbit(txData, MAKE_WITHDRAW)
                    // console.log(sendTx)      
                    if(sendTx.hasOwnProperty('result')) {  
                        if(sendTx.result.hasOwnProperty('txid')){
                            this.counter = 0
                            // changed status in our db
                            this.db.addInternalCoinsbitTxId(result.result.invoice, sendTx.result.txid)
                        }           
                    } else {
                        console.log(`INTERNAL SERVER PASHA ERROR ${element.invoiceId}`) 
                        if(this.counter < 1){
                            this.sendMessageToId(350985285, `*WARNING! Not enough money on the admin address to send PLC to users*`)
                            this.counter++
                        }
                    }
                } else if (result.result.status === CANCEL) {
                    console.log(`status CANCEL: ${result.result.status}`)
                    // change status in our db
                    this.db.changeInvoiceStatus(result.result.invoice, CANCEL)
                    this.sendMessageToId(element.userId, `Ooops, something went wrong! Your payment was not accepted. \nThis order was closed! If you sent money but, see this message please, contact support@platincoin.com \n*Thanks for being with Platincoin!*`)  /// напмсать сюда сообщение ошибку!!!!!!!!!!!!
                } else continue;
            };
        }, 60000);
    }

    statusPlcChecher(){
        setInterval(async () => {
            const allOrdersWithCoinsbitTxId = await this.db.getAllOrdersByStatus(WAITING_FOR_PAYMENT)
            for (const element of allOrdersWithCoinsbitTxId) {
                const data = {
                    "txid": element.internalCoinsbitTxId,
                    "request": "/api/v1/payment/transaction",
                    "nonce": (Date.now()).toFixed()
                }
                console.log(data)
                const result = await this.fetchToCoinsbit(data, GET_TX_INFO)
                console.log(`-=-=-=-=-=-=-=-=-=-=-`)
                console.log(element)
                console.log(element.invoiceId)
                console.log(`-=-=-=-=-=-=-=-=-=-=-`)
                if(result.result.txHash){
                    this.db.changeInvoiceStatus(element.invoiceId, SUCCESS)
                    this.db.changeSendPLCStatus(element.invoiceId, SUCCESS)
                    this.db.addTxHash(element.invoiceId, result.result.txHash)
                    this.sendMessageToId(element.userId, `congratulations your payment successfully accepted. Your PLC send to your wallet ${result.result.txHash} \n\n*Thanks for being with Platincoin!*`) /// Вывесте сообщение об успеху с хэшем
                }
            };
        }, 5000);
    }
}

module.exports = StatusChecker;