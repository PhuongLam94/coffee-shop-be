const jwt = require("./utils/jwt")
const allowedOrigins = require('./init-data/allowed-origin.json').join(",")

console.log(allowedOrigins)
var Koa = require('koa')
var Router = require('koa-router')
var BodyParser = require('koa-bodyparser')
var cors = require('koa-cors')
var logger = require('koa-logger')

var app = new Koa()
var router = new Router()

require("./utils/mongo")(app)

app.use(BodyParser())
    .use(logger())
    .use(cors())



var authRouter = require("./routers/auth")
var peopleRouter = require("./routers/people")
var usersRouter = require("./routers/users")
var ordersRouter = require("./routers/orders")
var drinksRouter = require("./routers/drinks")
var employeesRouter = require('./routers/employees')

app.use(authRouter.routes())
    .use(authRouter.allowedMethods())
    .use(peopleRouter.routes())
    .use(peopleRouter.allowedMethods())
    .use(usersRouter.routes())
    .use(usersRouter.allowedMethods())
    .use(ordersRouter.routes())
    .use(ordersRouter.allowedMethods()) 
    .use(drinksRouter.routes())
    .use(drinksRouter.allowedMethods())
    .use(employeesRouter.routes())
    .use(employeesRouter.allowedMethods())

app.listen(process.env.PORT || 3000)