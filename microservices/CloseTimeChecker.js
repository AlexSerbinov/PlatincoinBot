const db = require('../db/mongo')

// db.getAllOrders().then(res=>console.log(res))

setInterval(async () => {
    const allOrders = await db.getAllOrders()
    allOrders.forEach(element => {
        console.log(element.timestamp+10800)
        if(element.timestamp+10800 <= (Date.now()/1000).toFixed()) {
            console.log("true", element.timestamp)
            // change status in DB
        } else {
            console.log("false", element.timestamp)
        }
    });
}, 5000);