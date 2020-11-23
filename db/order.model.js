const mongoose = require('mongoose');
const Schema = mongoose.Schema

const OrderSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    invoiceId: {
        type: String,
        required: true
    },
    invoiceLink: {
        type: String,
        required: true
    },
    userAddress: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        default: ""
    },
    internalCoinsbitTxId: {
        type: String,
        default: ""
    },
    amountPLC: {
        type: Number,
        required: true
    },
    purchaseCurrency: {
        type: String,
        required: true
    },
    paidCurrencyAmount: {
        type: Number,
        default: 0,
        required: true
    },
    purchaseCurrencyAmount: {
        type: Number,
        required: true
    },
    finalSendedPlc: {
        type: Number,
        default: 0,
        required: true
    },
    invoiceStatus: {
        type: String,
        required: true
    },
    balanceToTradeStatus: {
        type: Boolean,
        default: false,
        // required: true
    },
    newMarketOrderStatus: {
        type: Boolean,
        default: false,
        // required: true
    },
    balanceToMainStatus: {
        type: Boolean,
        default: false,
        // required: true
    },
    sendPLCStatus: {
        type: String,
        default: ""
    },
    timestamp: {
        type: Number,
        default: (Date.now()/1000).toFixed()
    },
})

mongoose.model("orders", OrderSchema)