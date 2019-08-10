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
            httpHelper.setResponseErr(ctx, "Không tìm thấy nhân viên!", 404)
    } catch {
        httpHelper.setResponseErr(ctx, "Không tìm thấy nhân viên!", 404)
    }
})
/*
{
    username
    password
    role
    <other employee info>
}
*/
router.post("/employees", async (ctx) => {
    if (ctx.state.user.role === "admin"){
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
                role: requestBody.role,
                createdBy: ctx.state.user.username,
                createdAt: Date.now(),
            })
            if (result.result.ok === 1){
                var employee = Object.assign({
                    createdBy: ctx.state.user.username,
                    createdAt: Date.now(),
                    userId: result.ops[0]['_id']
                }, requestBody)
                
                var attrToDelete = ['username', 'password', 'role']
                attrToDelete.forEach(attr => {
                    delete employee[attr]
                });
                result = await ctx.app.employees.insertOne(employee)
                httpHelper.handleResultDB(ctx, result, 'Nhân viên được tạo thành công!')
            } else {
                ctx.status = 400
                ctx.body = {message: "Có lỗi xảy ra!"}
            }
        }
    } else {
        httpHelper.setResponseErr(ctx, "Bạn không có quyền tạo nhân viên, vui lòng liên hệ admin!", 403)
    }
   
})
/*{
    date: 'MM/dd/yyyy'
    slots: [
        'in': 'hh:mm',
        'out': 'hh:mm'
    ]
}*/
router.put('/employees/:id*/working-time', async (ctx) => {
    console.log(ctx.state.user)
    var employeeId
    var requestBody = ctx.request.body
    if (!ctx.params.id){
        var userEmp = await ctx.app.employees.findOne({userId: ObjectID(ctx.state.user.id)})
        console.log(userEmp)
        if (!userEmp){
            httpHelper.setResponseErr(ctx, 'Account không được liên kết với nhân viên nào!')
            return;
        } else {
            employeeId = userEmp['_id']
        }
    } else 
        employeeId = new ObjectID(ctx.params.id)
    
    var employeeWorkingTime = Object.assign({
        createdBy: ctx.state.user.username,
        createdAt: Date.now(),
        employeeId: employeeId
    }, requestBody)
    var result = await ctx.app.employeeWorkingTimes.insertOne(employeeWorkingTime)
    httpHelper.handleResultDB(ctx, result, 'Giờ làm được tạo thành công!')
})
module.exports = router
