var Router = require('koa-router')
const jwt = require("../utils/jwt")
const ObjectID = require("mongodb").ObjectID
const encrypt = require("../utils/encrypt")
var httpHelper = require("../utils/http-helper")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())

    router.get('/employees/:username*/working-times', async (ctx) => {
        if (ctx.state.user.role === "admin" || ctx.state.user.username === ctx.params.username){
            var fromDate = parseInt(ctx.request.query.fromDate)
            var toDate = parseInt(ctx.request.query.toDate)
            var workingTimeList
            var query = {}
            if (fromDate){
                query = Object.assign(query, {date: {"$gte": fromDate, "$lte": toDate}})
            }
            if (ctx.params.username){
                var selectedEmp = await ctx.app.employees.findOne({'username': ctx.params.username})
                query = Object.assign(query, {employeeId: selectedEmp._id})
            }
                
            workingTimeList = await ctx.app.employeeWorkingTimes.find(query).sort({employeeId: 1, date: -1}).toArray()
            var empWorkingTimeMap = new Map()
            for (var workingTime of workingTimeList){
                var empId = workingTime.employeeId.toString()
                var millisec = 0
                workingTime.slots.forEach(slot => millisec += slot.out-slot.in)
                if (!empWorkingTimeMap[empId]){
                    var empInfo = await ctx.app.employees.findOne({_id: workingTime.employeeId})
                        empWorkingTimeMap[empId] = {
                            id: empId,
                            name: empInfo.name,
                            total: millisec,
                            workingTimes: [workingTime]
                        }
                                      
                } else {
                    empWorkingTimeMap[empId].total += millisec
                    empWorkingTimeMap[empId].workingTimes.push(workingTime)
                }
            }
            console.log("xyz", [...empWorkingTimeMap.values()])
            httpHelper.setResponseBody(ctx, Object.values(empWorkingTimeMap))
        }
        else
            httpHelper.setResponseErr(ctx, "Bạn không có quyền xem báo cáo giờ làm nhân viên!", 403)
    })
router.get('/employees', async (ctx) => {
    if (ctx.state.user.role === "admin")
        ctx.body = await ctx.app.employees.find().toArray()
    else
        httpHelper.setResponseErr(ctx, "Bạn không có quyền xem danh sách nhân viên!", 403)
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
            ctx.body = {message: "Username đã tồn tại, vui lòng chọn username khác!"}
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
                    createdAt: Date.now()
                }, requestBody)
                
                var attrToDelete = ['password', 'role']
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
router.put('/employees/:id*/working-times', async (ctx) => {
    var employeeId
    var requestBody = ctx.request.body
    if (!ctx.params.id){
        var userEmp = await ctx.app.employees.findOne({username: ctx.state.user.username})
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
