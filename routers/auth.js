
const jwt = require("../utils/jwt")
const encrypt = require("../utils/encrypt")
var Router = require('koa-router')
var router = new Router()


router.post("/auth", async (ctx) => {
    let username = ctx.request.body.username
    let password = encrypt(ctx.request.body.password)
    let docQuery = {username: username, password: password}
    var account = await ctx.app.users.findOne(docQuery)

    if (account){
        var employee = await ctx.app.employees.findOne({userId: account['_id']})
        ctx.body = {
            message: "Đăng nhập thành công!",
            token: jwt.issue({
                username: username, 
                id: account['_id'], 
                role: account.role,

            }),
            role: account.role,
            employeeName: employee ? employee.name : username
        }
    } else {
        ctx.status = 401
        ctx.body = {message: "Sai username/password!"}
    }
})
module.exports = router
