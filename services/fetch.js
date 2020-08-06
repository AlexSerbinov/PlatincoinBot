const fetch = require('node-fetch')
const btoa = require('btoa')
const crypto = require('crypto');
require('dotenv').config();

const fetchToCoinsbit = async (data, url) => {
    try {
        const jsonString = JSON.stringify(data)
        const payload = btoa(jsonString)
        const signature = crypto.createHmac("sha512", process.env.API_SECRET).update(payload).digest().toString('hex')
        const result = await fetch(url, {
            method: 'post',
            body: JSON.stringify(data),
            headers: { 
                'Content-Type': 'application/json',
                'X-TXC-APIKEY': process.env.API_KEY,
                'X-TXC-PAYLOAD': payload,
                'X-TXC-SIGNATURE': signature,
            },
        }).then(res => res.json())
        return result
    } catch (error) {
        console.log(error)
        return(error) 
    }
}

const fetchCurrencyPairRate = async currency => {
    try{
        currency = currency.split(" ")[0]
        const url = `https://coinsbit.io/api/v1/public/ticker?market=PLC_${currency}`
        const res = await fetch(url).then(res => res.json())
        console.log(res.result.ask)
        return res.result.ask;
    } catch(error){ 
        return false
    }
}

module.exports = {fetchToCoinsbit, fetchCurrencyPairRate}