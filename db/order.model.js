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
    amountPLC: {
        type: Number,
        required: true
    },
    purchaseCurrency: {
        type: String,
        required: true
    },
    purchaseCurrencyAmount: {
        type: Number,
        required: true
    },
    paymentSystem: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    },
})

mongoose.model("orders", OrderSchema)