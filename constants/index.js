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
const SUCCESS_SMALL_AMOUNT = 'SUCCESS_SMALL_AMOUNT'
const PAID = 'PAID'
const SUCCESS = 'SUCCESS'
const CANCEL = 'CANCEL'
const WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT'

//balance transfer
const TO_TRADE = 'totrade'
const TO_MAIN = 'tomain'

// COINSBIT API URL's
const GENERATE = 'https://coinsbit.io/api/v1/merchant/generate_invoice'
const GET_BALANCE = 'https://coinsbit.io/api/v1/payment/balances'
const GET_STATUS = 'https://coinsbit.io/api/v1/merchant/invoice_status'
const BALANCE_TRANSFER = 'https://slave1.coinsdev.space/api/v1/payment/balancetransfer'
const NEW_MARKET_ORDER = 'https://slave1.coinsdev.space/api/v1/payment/newmarketorder'
const MAKE_WITHDRAW = 'https://coinsbit.io/api/v1/payment/makewithdraw'
const GET_TX_INFO = 'https://coinsbit.io/api/v1/payment/transaction'
// const RETURN_URL = 'tg://resolve?domain=coinsbit_buy_sell_bot'
const RETURN_URL = 't.me/PLC_Payment_Bot'

// telegram profiles
const ADMIN1_ADDRESS = 350985285
module.exports = {
    USD,
    EUR,
    USDT,
    TUSD,
    PAX,
    IN_PROGRESS,
    INITIALIZATION,
    PENDING,
    SUCCESS_SMALL_AMOUNT,
    SUCCESS,
    PAID,
    CANCEL,
    WAITING_FOR_PAYMENT,
    TO_TRADE,
    TO_MAIN,
    GENERATE,
    GET_BALANCE,
    GET_STATUS,
    BALANCE_TRANSFER,
    NEW_MARKET_ORDER,
    MAKE_WITHDRAW,
    GET_TX_INFO,
    ADMIN1_ADDRESS,
}