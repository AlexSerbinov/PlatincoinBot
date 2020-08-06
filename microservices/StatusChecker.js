const db = require('../db/mongo')
const { fetchToCoinsbit } = require('../services/fetch');
const { sendMessageToId } = require('../botMain');
const {
    GET_STATUS,
    MAKE_WITHDRAW,
    SUCCESS,
    CANCEL,
 } = require('../constants');

setInterval(async () => {
    const allOrders = await db.getAllPendingOrders()
    for (const element of allOrders) {
        // console.log(element.invoiceId)
        const data = {
            "invoice": element.invoiceId,
            "request": "/api/v1/merchant/invoice_status",
            "nonce": (Date.now()).toFixed()
        }
        const result = await fetchToCoinsbit(data, GET_STATUS)
        // console.log(result)
        if (result.result.status === SUCCESS) { 
            console.log(`status SUCCESS: ${result.result.status}`)
            // my coinsbit PLC address = 'P4uEbj3E3Aky1ZQ7ztaz31F4sVcGn1bfDLaf'
            // send tx to user
            const txData = {
                "ticker": "PLC",
                "amount": element.amountPLC, 
                "address": element.userAddress, 
                "request": "/api/v1/payment/makewithdraw",
                "nonce": (Date.now()/1000).toFixed(),
            }
            const sendTx = await fetchToCoinsbit(txData, MAKE_WITHDRAW)
            console.log(sendTx)      
            if(sendTx.hasOwnProperty('result')) {  
                if(sendTx.result.hasOwnProperty('txHash')){
                    // changed status in our db
                    db.changeStatus(result.result.invoice, SUCCESS)
                    db.addTxHash(element.invoiceId, sendTx.result.txHash)
                    sendMessageToId(element.userId, sendTx.result.txHash) /// Вывесте сообщение об успеху с хэшем
                }           
            } else {
                console.log(`INTERNAL SERVER PASHA ERROR`) 
                sendMessageToId(350985285, "not enogth money at admin address")
            }
        } else if (result.result.status === CANCEL) {
            console.log(`status CANCEL: ${result.result.status}`)
            // change status in our db
            db.changeStatus(result.result.invoice, CANCEL)
            sendMessageToId(element.userId, "sendTx.result.txHash")  /// напмсать сюда сообщение ошибку!!!!!!!!!!!!
        } else continue;
    };
}, 30000);
