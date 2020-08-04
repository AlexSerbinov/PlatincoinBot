const fetch = require('node-fetch')
const btoa = require('btoa')
const crypto = require('crypto');
require('dotenv').config();

const fetchToCoinsbit = async (data, url) => {
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
}

const fetchCurrencyPairRate = async currency => {
    try{
        currency = currency.split(" ")[0]
        const url = `https://coinsbit.io/api/v1/public/ticker?market=PLC_${currency}`
        const res = await fetch(url).then(res => res.json())
        console.log(res.result.ask)
        return res.result.ask;
    } catch(e){
        console.log(e) //по идее лучше заносить значения в бд и если эррор, то доставать значения с бд. Или не лучше, хз:)
    }
}

module.exports = {fetchToCoinsbit, fetchCurrencyPairRate}