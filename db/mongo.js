const mongoose = require('mongoose');
require('./order.model')

mongoose.connect('mongodb://172.20.0.3/platincoin-order', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => console.log("Connected successfully to MongoDB"))
    .catch(e => console.error(e))

const orderModel = mongoose.model('orders');

class Order {
    static async getAllOrders() {
        try {
            return orderModel
                .find()
                .then(orders => orders);
        } catch (error) {
            return error;
        }
    }
    
    static async createOrder(data){
        try {
            const order = new orderModel(data);
            return order
			    .save()
			    .then(result => result)
        } catch (error) {
            return error;
        }
    }
    
    static async getOrdersByUserId(id){
        try {
            return orderModel
		        .find({userId: id})
		        .then(orders => orders); 
        } catch (error) {
            return error;
        }
    }
    
    static async deleteAllOrders(){
        try {
            return orderModel
                .find()
                .remove()
                .then(orders => orders)
        } catch (error) {
            return error;
        }
    }

    static async addTxHash(invoiceId, hash){
        try {
            return orderModel
                .findOneAndUpdate({invoiceId}, {hash})
                .then(order => order)
        } catch (error) {
            return error;
        }
    }
    static async addInternalCoinsbitTxId(invoiceId, internalCoinsbitTxId){
        try {
            return orderModel
                .findOneAndUpdate({invoiceId}, {internalCoinsbitTxId})
                .then(order => order)
        } catch (error) {
            return error;
        }
    }

    static async getOrderByInvoiceId(id){
        try {
            return orderModel
		        .find({invoiceId: id})
		        .then(orders => orders); 
        } catch (error) {
            return error;
        }
    }

    static async changeInvoiceStatus(invoiceId, invoiceStatus){
        try {
            return orderModel
                .findOneAndUpdate({invoiceId}, {invoiceStatus})
                .then(order => order)
        } catch (error) {
            return error;
        }
    }

    static async changeSendPLCStatus(invoiceId, sendPLCStatus){
        try {
            return orderModel
                .findOneAndUpdate({invoiceId}, {sendPLCStatus})
                .then(order => order)
        } catch (error) {
            return error;
        }
    }

    static async getAllOrdersByStatus(status){
        try {
            return orderModel
                .find({ invoiceStatus: status})
                .then(orders => orders)
        } catch (error) {
            return error;
        }
    }

 

}

module.exports = Order;