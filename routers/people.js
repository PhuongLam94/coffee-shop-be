const ObjectID = require("mongodb").ObjectID
var Router = require('koa-router')
const jwt = require("../utils/jwt")
var router = new Router()

router.use(jwt.errorHandler())
    .use(jwt.jwt())

router.get("/people", async (ctx) => {
    ctx.body = await ctx.app.people.find().toArray()
})
router.post("/people", async (ctx) => {
    ctx.body = await ctx.app.people.insert(ctx.request.body)
})
router.get("/people/:id", async (ctx) => {
    ctx.body = await ctx.app.people.findOne({ "_id": ObjectID(ctx.params.id) })
})
router.put("/people/:id", async (ctx) => {
    let documentQuery = { "_id": ObjectID(ctx.params.id) }
    let valuesToUpdate = ctx.request.body
    ctx.body = await ctx.app.people.updateOne(documentQuery, { "$set": valuesToUpdate })
})
router.delete("/people/:id", async (ctx) => {
    let documentQuery = { "_id": ObjectID(ctx.params.id) }
    ctx.body = await ctx.app.people.deleteOne(documentQuery)
})

module.exports = router