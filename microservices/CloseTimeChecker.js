const db = require('../db/mongo')
const {fetchToCoinsbit} = require('../services/fetch');
const { GET_STATUS } = require('../constants');


setInterval(async () => {
    const allOrders = await db.getAllOrders()
    for (const element of allOrders) {

        console.log(element.invoiceId)
        const data = {
            "invoice": element.invoiceId,
            "request": "/api/v1/merchant/invoice_status",
            "nonce": (Date.now()).toFixed()
        }
        console.log(data.nonce)
        const result = await fetchToCoinsbit(data, GET_STATUS)//.then(res=>console.log(res))
        console.log(result)
        // if(element.timestamp+10800 <= (Date.now()/1000).toFixed()) {
            
        //     console.log("true", element.timestamp)
        //     // change status in DB
        // } else {
        //     console.log("false", element.timestamp)
        // }
    };
}, 5000);
