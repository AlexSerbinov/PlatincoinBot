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
    const allOrders = await db.getAllOrders()
    for (const element of allOrders) {
        console.log(element.invoiceId)
        const data = {
            "invoice": element.invoiceId,
            "request": "/api/v1/merchant/invoice_status",
            "nonce": (Date.now()).toFixed()
        }
        const result = await fetchToCoinsbit(data, GET_STATUS)
        console.log(result)
        if (result.result.status === SUCCESS || true) {   // DELETE TRUE!!!!!
            console.log(`status SUCCESS: ${result.result.status}`)
            // change status in our db
            // my coinsbit PLC address = 'P4uEbj3E3Aky1ZQ7ztaz31F4sVcGn1bfDLaf'
            // send tx to user
            const txData = {
                "ticker": "PLC",
                "amount": 0.0001, 
                "address": 'P4uEbj3E3Aky1ZQ7ztaz31F4sVcGn1bfDLaf', 
                "request": "/api/v1/payment/makewithdraw",
                "nonce": (Date.now()/1000).toFixed(),
            }
            const sendTx = await fetchToCoinsbit(txData, MAKE_WITHDRAW)
            // console.log(sendTx.result.txHash)      
            // if(sendTx.result.txHash || true) {              //not checed !!
            if(true) {              //not checed !!
                db.changeStatus(result.result.invoice, SUCCESS)
                db.addTxHash(element.invoiceId, "sendTx.result.txHash")
                sendMessageToId(element.userId, "sendTx.result.txHash")
            }
        } else if (result.result.status === CANCEL) {
            console.log(`status CANCEL: ${result.result.status}`)
            // change status in our db
            db.changeStatus(result.result.invoice, CANCEL)
        } else continue;

    };
}, 8000);
