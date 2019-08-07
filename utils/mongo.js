const MongoClient = require('mongodb').MongoClient
const env = require('../env')
const MONGO_URL = env[process.argv[2]].MONGO_URL
console.log(MONGO_URL)
module.exports = function(app) {
    MongoClient.connect(MONGO_URL, {useNewUrlParser: true})
        .then((connection) => {
            var db = connection.db('koa-first-project')
            app.people = db.collection("people")
            app.users = db.collection("users")
            app.orders = db.collection("orders")
            app.orderDetail = db.collection("order-detail")
            app.drinks = db.collection("drinks").find().toArray()
            console.log("Database connection established")
        })
        .catch((err) => console.log(err))
}