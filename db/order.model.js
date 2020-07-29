const mongoose = require('mongoose');
const Schema = mongoose.Schema

const OrderSchema = new Schema({
    chatId: {
        type: Number,
        required: true
    },
    userAddress: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
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
})

mongoose.model("orders", OrderSchema)