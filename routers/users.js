var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())

router.post("/users", async (ctx) => {
    var requestBody = ctx.request.body
    var existingAcc = ctx.app.users.findOne({username: requestBody.username})
    if (existingAcc){
        ctx.status = 400
        ctx.body = {message: "Username đã tồn tại, vui lòng chọn username khác!"}
    } else {
        requestBody.password = encrypt(requestBody.password)
        if (!requestBody.role)
            requestBody.role = 'member'
        var result = await ctx.app.users.insertOne(requestBody)
        if (result.result.ok === 1){
            ctx.status = 200
            ctx.body = {message: "User được tạo thành công!"}
        } else {
            ctx.status = 400
            ctx.body = {message: "Có lỗi xảy ra!"}
        }
    }
})
router.put('/users/change-password', async (ctx) => {
    var currentUsername = ctx.state.user.username
    var oldPass = encrypt(ctx.request.body.oldPass)
    var docQuery = {username: currentUsername, password: oldPass}
    var account = await ctx.app.users.findOne(docQuery)
    
    if (account){
        var newPass = encrypt(ctx.request.body.newPass)
        var result = await ctx.app.users.updateOne(docQuery, {"$set":{password: newPass}})
        if (result.result.ok === 1){
            ctx.status = 200
            ctx.body = {message: "Password được đổi thành công!"}
        } else {
            ctx.status = 400
            ctx.body = {message: "Có lỗi xảy ra!"}
        }
    } else {
        ctx.status = 400
        ctx.body = {message: "Password cũ không đúng!"}
    }
})
router.get('/users/:id*/detail', async (ctx) => {
    var username = ctx.request.params.username || ctx.state.user.username
    if (ctx.state.user.username === username || ctx.state.user.role === 'admin'){
        var result = await ctx.app.users.findOne({"username": username})
        if (result)
            httpHelper.setResponseBody(ctx, result)
        else
            httpHelper.setResponseErr(ctx, "Không tìm thấy tài khoản!", 404)
    } else {
        httpHelper.setResponseErr(ctx, "Bạn không có quyền xem chi tiết của tài khoản này!", 403)
    }
})
module.exports = router
