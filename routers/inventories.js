var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())

/*
- ingredient 
- quantity
- type (in/out)
- price
- date
- creator
- created date
*/
router.post('/inventories', async (ctx) => {
    var inventories = Object.assign({
        createdBy: ctx.state.user.username,
        createdAt: Date.now()
    }, ctx.request.body)
    var result = await ctx.app.inventories.insertOne(inventories)
    var successMsg = (inventories.type === 'in'?'Nhập':'Xuất') + ' kho được tạo thành công'
    httpHelper.handleResultDB(ctx, result, successMsg)
})
router.get('/inventories', async (ctx) => {
    if (ctx.state.user.role === "admin")
        ctx.body = await ctx.app.inventories.find().toArray()
    else
        httpHelper.setResponseErr(ctx, "Bạn không có quyền xem danh sách nhập/xuất kho!", 403)
})

module.exports = router
