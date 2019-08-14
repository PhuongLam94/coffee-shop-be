var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()
var format = require('date-fns').format
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
        var query =  {}
        var expenseList, orderList
        if (fromDate){
            query =  {...{date: {"$gte": fromDate, "$lte": toDate}}}
        }
        var expenseList = await ctx.app.expenses.find(query).sort({date: -1}).toArray()
        var orderList =  await ctx.app.orders.find(query).sort({date: -1}).toArray()
        var inventoryList =  await ctx.app.inventories.find(query).sort({date: -1}).toArray()
        var outcome = 0, income = 0, revenue = 0, inInventory = 0, outInventory = 0
        expenseList.forEach(expense => {
            if (expense.type === 'in')
                income += expense.amount
            else
                outcome += expense.amount
        })
        var orderMap = new Map()
        orderList.forEach(order => {
            revenue+=order.amount
            var orderDate = format(order.date, 'MMDDYYYY')
            if (!orderMap[orderDate]) {
                orderMap[orderDate] = {
                    type: "in",
                    amount: order.amount,
                    date: order.date,
                    description: "Thu nhập ngày "+format(order.date, 'DD/MM/YYYY')
                }
            } else {
                orderMap[orderDate].amount += order.amount
            }
        })
        var inventoryRecords = []
        inventoryList.forEach(inventory => {
            var description = ''
            if (inventory.type == "in"){
                description += "Nhập"
                inInventory += inventory.price
            } else {
                description += "Xuất"
                outInventory += inventory.price
            }
            description += ` ${inventory.quantity} ${inventory.ingredient.unit.storage} ${inventory.ingredient.name}`
            if (inventory.description)
                description += inventory.description
            inventoryRecords.push({
                    type: inventory.type === "in"?"out":"in",
                    amount: inventory.price,
                    date: inventory.date,
                    description: description
            })

        })
        var responseBody = {
            expenseList: expenseList.concat(Object.values(orderMap), inventoryRecords),
            outcome: outcome,
            income: income,
            revenue: revenue,
            inInventory: inInventory,
            outInventory: outInventory
        }
        httpHelper.setResponseBody(ctx, responseBody)
    }
    else
        httpHelper.setResponseErr(ctx, "Bạn không có quyền xem danh sách chi phí/thu nhập!", 403)
})
module.exports = router
