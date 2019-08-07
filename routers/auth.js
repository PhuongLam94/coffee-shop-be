
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
        ctx.app.currentUser = {username: username, id: account['_id'], role: account.role}
        ctx.body = {
            token: jwt.issue({
                user: account.username,
                role: account.role
            })
        }
    } else {
        ctx.status = 401
        ctx.body = {message: "Invalid login"}
    }
})
module.exports = router
