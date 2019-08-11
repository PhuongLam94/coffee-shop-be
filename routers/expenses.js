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
    if (ctx.state.user.role === "admin")
        ctx.body = await ctx.app.expenses.find().toArray()
    else
        httpHelper.setResponseErr(ctx, "Bạn không có quyền xem danh sách chi phí/thu nhập!", 403)
})
module.exports = router
