var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())


router.post("/orders", async (ctx) => {
    var requestBody = ctx.request.body
    for (var item of requestBody.items){
        item['_id'] = ObjectID(item['_id'])
    }
    var order = {
        createdDate: Date.now(),
        createdBy: ctx.app.currentUser.username,
        amount: requestBody.amount,
        items: requestBody.items || []
    }
    var result = await ctx.app.orders.insertOne(order)
    httpHelper.handlResultDB(ctx, result, "Order is created successfully.")
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
            httpHelper.setResponseErr(ctx, "Order not found.", 404)
    } catch {
        httpHelper.setResponseErr(ctx, "Order not found.", 404)
    }
    
})

module.exports = router
