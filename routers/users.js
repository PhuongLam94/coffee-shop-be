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
        ctx.body = {message: "Username is existing, please use another username"}
    } else {
        requestBody.password = encrypt(requestBody.password)
        if (!requestBody.role)
            requestBody.role = 'member'
        var result = await ctx.app.users.insertOne(requestBody)
        if (result.result.ok === 1){
            ctx.status = 200
            ctx.body = {message: "User is created successfully."}
        } else {
            ctx.status = 400
            ctx.body = {message: "Error happened."}
        }
    }
})
router.put('/users/change-password', async (ctx) => {
    var currentUsername = ctx.app.currentUser.username
    var oldPass = encrypt(ctx.request.body.oldPass)
    var docQuery = {username: currentUsername, password: oldPass}
    var account = await ctx.app.users.findOne(docQuery)
    
    if (account){
        var newPass = encrypt(ctx.request.body.newPass)
        var result = await ctx.app.users.updateOne(docQuery, {"$set":{password: newPass}})
        if (result.result.ok === 1){
            ctx.status = 200
            ctx.body = {message: "Password is updated successfully"}
        } else {
            ctx.status = 400
            ctx.body = {message: "Error happened."}
        }
    } else {
        ctx.status = 400
        ctx.body = {message: "Incorrect password."}
    }
})
router.get('/users/detail', async (ctx) => {
    var username = ctx.request.query.username || ctx.app.currentUser.username
    if (ctx.app.currentUser.username === username || ctx.app.currentUser.role === 'admin'){
        var result = await ctx.app.users.findOne({"username": username})
        if (result)
            httpHelper.setResponseBody(ctx, result)
        else
            httpHelper.setResponseErr(ctx, "User not found", 404)
    } else {
        httpHelper.setResponseErr(ctx, "You don't have permission to get this user detail.", 403)
    }
})
module.exports = router
