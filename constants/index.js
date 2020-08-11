// currency
const USD = 'USD'
const EUR = 'EUR'
const USDT = 'USDT'
const TUSD = 'TUSD'
const PAX = 'PAX'

// status
const IN_PROGRESS = 'IN_PROGRESS'
const INITIALIZATION = 'INITIALIZATION'
const PENDING = 'PENDING'
const SUCCESS = 'SUCCESS'
const CANCEL = 'CANCEL'
const WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT'

// COINSBIT API URL's
const GENERATE = 'https://coinsbit.io/api/v1/merchant/generate_invoice'
const GET_STATUS = 'https://coinsbit.io/api/v1/merchant/invoice_status'
const MAKE_WITHDRAW = 'https://coinsbit.io/api/v1/payment/makewithdraw'
const GET_TX_INFO = 'https://coinsbit.io/api/v1/payment/transaction'
const RETURN_URL = 'tg://resolve?domain=coinsbit_buy_sell_bot'

module.exports = {
    USD,
    EUR,
    USDT,
    TUSD,
    PAX,
    IN_PROGRESS,
    INITIALIZATION,
    PENDING,
    SUCCESS,
    CANCEL,
    WAITING_FOR_PAYMENT,
    GENERATE,
    GET_STATUS,
    MAKE_WITHDRAW,
    GET_TX_INFO,
    RETURN_URL,
}