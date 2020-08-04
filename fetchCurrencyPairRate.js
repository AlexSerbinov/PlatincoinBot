const fetch = require('node-fetch')
const USD = 'USD'
const EUR = 'EUR'
const USDT = 'USDT'
const TUSD = 'TUSD'
const PAX = 'PAX'

async function fetchRate(currency){
    try{
        const url = `https://coinsbit.io/api/v1/public/ticker?market=PLC_${currency}`
        const res = await fetch(url).then(res => res.json())
        console.log(res.result.ask)
        return res.result.ask;
    } catch(e){
        console.log(e) //по идее лучше заносить значения в бд и если эррор, то доставать значения с бд. Или не лучше, хз:)
    }
}

let price = fetchRate(USD)