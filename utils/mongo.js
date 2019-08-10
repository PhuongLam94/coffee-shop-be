const MongoClient = require('mongodb').MongoClient
const env = require('../env')[process.argv[2] || 'local']
const MONGO_URL = env.MONGO_URL
module.exports = function(app) {
    MongoClient.connect(MONGO_URL, {useNewUrlParser: true})
        .then((connection) => {
            var db = connection.db(env.DB_NAME)
            app.people = db.collection("people")
            app.users = db.collection("users")
            app.orders = db.collection("orders")
            app.orderDetail = db.collection("order-detail")
            app.drinks = db.collection("drinks").find().toArray()
            app.employees = db.collection("employees")
            app.employeeWorkingTimes = db.collection("employee-working-times")
            app.expenses = db.collection("expenses")
            console.log("Database connection established")
        })
        .catch((err) => console.log(err))
}