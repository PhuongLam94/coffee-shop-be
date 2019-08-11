var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())

/*
{
    amount,
    description
    type,
    date
}
*/
router.post('/expenses', async (ctx) => {
    console.log(ctx.state.user)
    var expense = Object.assign({
        createdBy: ctx.state.user.username,
        createdAt: Date.now()
    }, ctx.request.body)
    var result = await ctx.app.expenses.insertOne(expense)
    var message = (expense.type === 'in'?'Thu nhập':'Chi phí') + ' được tạo thành công!'
    httpHelper.handleResultDB(ctx, result, message)
})
router.get('/expenses', async (ctx) => {
    if (ctx.state.user.role === "admin"){
        var fromDate = parseInt(ctx.request.query.fromDate)
        var toDate = parseInt(ctx.request.query.toDate)
        var expenseList, orderList
        if (!fromDate){
            expenseList = await ctx.app.expenses.find().sort({date: -1}).toArray()
            orderList = await ctx.app.orders.find().toArray()
        } else {
            var query =  {"$gte": fromDate, "$lte": toDate}
            console.log(query)
            expenseList = await ctx.app.expenses.find({
                date: query
            }).sort({date: -1}).toArray()
            orderList =  await ctx.app.orders.find({
                createdDate: query
            }).sort({date: -1}).toArray() 
        }
        var outcome = 0, income = 0, revenue = 0
        expenseList.forEach(expense => {
            if (expense.type === 'in')
                income += expense.amount
            else
                outcome += expense.amount
        })
        orderList.forEach(order => revenue+=order.amount)
        var responseBody = {
            expenseList: expenseList,
            outcome: outcome,
            income: income,
            revenue: revenue
        }
        httpHelper.setResponseBody(ctx, responseBody)
    }
    else
        httpHelper.setResponseErr(ctx, "Bạn không có quyền xem danh sách chi phí/thu nhập!", 403)
})
module.exports = router
