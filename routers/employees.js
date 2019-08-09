var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())

router.get('/employees', async (ctx) => {
    ctx.body = await ctx.app.orders.find().toArray()
})
router.get('/employees/:id', async (ctx) => {
    try{
        var result = await ctx.app.employees.findOne({'_id': ObjectID(ctx.params.id)})
        if (result)
            httpHelper.setResponseBody(ctx, result)
        else
            httpHelper.setResponseErr(ctx, "Employee not found.", 404)
    } catch {
        httpHelper.setResponseErr(ctx, "Employee not found.", 404)
    }
})
/*
{
    username
    password
    name
    dob
    id card number
    start date
}
*/
router.post("/employees", async (ctx) => {
    if (ctx.app.currentUser.role === "admin"){
        var requestBody = ctx.request.body
        var existingAcc = await ctx.app.users.findOne({username: requestBody.username})
        if (existingAcc){
            ctx.status = 400
            ctx.body = {message: "Username is existing, please use another username"}
        } else {
            requestBody.password = encrypt(requestBody.password)
            if (!requestBody.role)
                requestBody.role = 'member'
            var result = await ctx.app.users.insertOne({
                username: requestBody.username,
                password: requestBody.password,
                role: requestBody.role
            })
            if (result.result.ok === 1){
                console.log(result)
                var employee = {
                    userId: result.ops[0]['_id'],
                    name: requestBody.name,
                    dob: new Date(requestBody.dob).getTime(),
                    idCardNo: requestBody.idCardNo,
                    startDate: new Date(requestBody.startDate).getTime(),
                    createdDate: Date.now(),
                    createdBy: ctx.app.currentUser.username,
                }
                result = await ctx.app.employees.insertOne(employee)
                httpHelper.handlResultDB(ctx, result, 'Employee is created successfully.')
            } else {
                ctx.status = 400
                ctx.body = {message: "Error happened."}
            }
        }
    } else {
        httpHelper.setResponseErr(ctx, "You don't have permission to create employee", 403)
    }
   
})

module.exports = router
