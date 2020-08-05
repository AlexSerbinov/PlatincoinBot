const db = require('../db/mongo')
const { fetchToCoinsbit } = require('../services/fetch');
const {
    GET_STATUS,
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
        if (result.result.status === SUCCESS) {
            console.log(`status SUCCESS: ${result.result.status}`)
            // change status in our db
            db.changeStatus(result.result.invoice, SUCCESS)
            // send tx to user
            // here
        } else if (result.result.status === CANCEL) {
            console.log(`status CANCEL: ${result.result.status}`)
            // change status in our db
            db.changeStatus(result.result.invoice, CANCEL)
        } else continue;

    };
}, 30000);
