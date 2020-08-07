const { fetchToCoinsbit, fetchCurrencyPairRate } = require('./services/fetch')

const alexCoinsbitPLCAddress = 'P4u8crggmgmTdo2Se4YxByZfowx7tMousCzM'
const txData = {
    "ticker": "PLC",
    "amount": 2, 
    "address": alexCoinsbitPLCAddress, 
    "request": "/api/v1/payment/makewithdraw",
    "nonce": (Date.now()/1000).toFixed(),
}

   fetchToCoinsbit(txData, "https://slave1.coinsdev.space/api/v1/payment/makewithdraw")
   .then(res => console.log(res))
   .catch(e => console.log("error", e))
