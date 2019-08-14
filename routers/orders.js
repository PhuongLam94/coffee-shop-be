var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())


router.post("/orders", async (ctx) => {
    console.log(ctx.state.user)
    var requestBody = ctx.request.body
    for (var item of requestBody.items){
        item['_id'] = ObjectID(item['_id'])
    }
    var order = {
        createdDate: Date.now(),
        date: Date.now(),
        createdBy: ctx.state.user.username,
        amount: requestBody.amount,
        items: requestBody.items || [],
        isCompleted: true
    }
    var result = await ctx.app.orders.insertOne(order)
    httpHelper.handleResultDB(ctx, result, "Đơn hàng được tạo thành công!")
})
router.get('/orders', async (ctx) => {
    ctx.body = await ctx.app.orders.find().toArray()
})
router.get('/orders/:id', async (ctx) => {
    try{
        var result = await ctx.app.orders.findOne({'_id': ObjectID(ctx.params.id)})
        if (result)
            httpHelper.setResponseBody(ctx, result)
        else
            httpHelper.setResponseErr(ctx, "Không tìm thấy đơn hàng!", 404)
    } catch {
        httpHelper.setResponseErr(ctx, "Không tìm thấy đơn hàng!", 404)
    }
    
})
router.delete('/orders/:id', async (ctx) => {
    try{
        var result = await ctx.app.orders.findOne({'_id': ObjectID(ctx.params.id)})
        if (result){
            if (result.createdBy == ctx.state.user.username || ctx.state.user.role === 'admin'){
                result = await ctx.app.orders.removeOne({'_id': ObjectID(ctx.params.id)})
                httpHelper.handleResultDB(ctx, result, 'Đơn hàng được xoá thành công!')
            } else {
                httpHelper.setResponseErr(ctx, 'Bạn không có quyền xoá đơn hàng này. Vui lòng liên hệ admin hoặc người tạo đơn!')
            }
        }
        else
            httpHelper.setResponseErr(ctx, "Không tìm thấy đơn hàng!", 404)
    } catch {
        httpHelper.setResponseErr(ctx, "Không tìm thấy đơn hàng!", 404)
    }
})
router.put('/orders/:id/complete', async (ctx) => {
    try{
        var result = await ctx.app.orders.updateOne({'_id': ObjectID(ctx.params.id)}, {"$set": {"isCompleted": true}})
        httpHelper.handleResultDB(ctx, result, 'Đơn hàng đã hoàn thành!')
    } catch {
        httpHelper.setResponseErr(ctx, "Không tìm thấy đơn hàng!", 404)        
    }
})
module.exports = router
