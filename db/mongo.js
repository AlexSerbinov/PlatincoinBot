const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/platincoin-order', { useNewUrlParser: true, useUnifiedTopology: true })
	.then(()=> console.log("Connected successfully to MongoDB"))
    .catch(e => console.error(e))
    
require('./order.model')
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
}

module.exports = Order;