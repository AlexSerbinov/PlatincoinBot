const fetch = require('node-fetch')
const USD = 'USD'
const EUR = 'EUR'
const USDT = 'USDT'
const TUSD = 'TUSD'
const PAX = 'PAX'

async function fetchRate(currency){
    try{
        const url = `https://coinsbit.io/api/v1/public/ticker?market=PLC_${currency}`
        let res = await fetch(url)
        res = await res.json()
        res = res.result.ask
        console.log(res)
        return res
    } catch(e){
        console.log(e) //по идее лучше заносить значения в бд и если эррор, то доставать значения с бд. Или не лучше, хз:)
    }
}

let price = fetchRate(USD)

