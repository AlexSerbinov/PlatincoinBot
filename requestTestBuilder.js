const  btoa = require('btoa')
const CryptoJS = require(`crypto-js`)
const crypto = require('crypto');
const apiKey = "d1319e207e6713f459192ae1af1a2ffb"
const apiSecret = "6e45af12dfbf1958099e1cc1427f4efe"
const data = {
    "currency": "USDT",
    "success_url": "http://buy.ru/success",
    "error_url": "http://buy.ru/error",
    "amount": 10,
    "request": "/api/v1/merchant/generate_invoice",
    "nonce": "123456s"
}
const jsonString = JSON.stringify(data)
console.log(`\n${jsonString}`)
let payload = btoa(jsonString)
console.log(payload)
const signature = crypto.createHmac("sha512", apiSecret).update(payload).digest().toString('hex')

console.log()
console.log(signature)