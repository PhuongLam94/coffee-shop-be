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
    ctx.request.body.quantity = parseFloat(ctx.request.body.quantity)
    var inventories = Object.assign({
        createdBy: ctx.state.user.username,
        createdAt: Date.now()
    }, ctx.request.body)
    var result = await ctx.app.inventories.insertOne(inventories)
    var successMsg = (inventories.type === 'in'?'Nhập':'Xuất') + ' kho được tạo thành công'
    httpHelper.handleResultDB(ctx, result, successMsg)
})
router.get('/inventories', async (ctx) => {
    if (ctx.state.user.role === "admin"){
        var fromDate = parseInt(ctx.request.query.fromDate)
        var toDate = parseInt(ctx.request.query.toDate)
        var query = {}
        if (fromDate){
            query = Object.assign(query, {date: {"$gte": fromDate, "$lte": toDate}})
        }
        var inventoryList = await ctx.app.inventories.find(query).sort({'ingredient.name': 1, date: -1}).toArray()
        var drinkMap = new Map()
        ctx.app.drinks.forEach(drink => 
            drinkMap[drink._id] = Object.assign({quantity: 0}, drink)
        )
        var orderList = await ctx.app.orders.find(query).toArray()
        var ingredientMap = new Map()
        var ingredientList = await ctx.app.ingredients.find().toArray()
        ingredientList.forEach(ingredient=>
            ingredientMap[ingredient.code] = {
                ingredientInfo: ingredient, 
                storageAmount: 0, 
                orderAmount: 0, 
                inventories: [],
                drinks: new Map() }
        )
        inventoryList.forEach(inventory => {
            var ingredientCode = inventory.ingredient.code
            ingredientMap[ingredientCode].storageAmount += inventory.type === 'in'? inventory.quantity:(0-inventory.quantity)
            delete inventory.ingredient
            ingredientMap[ingredientCode].inventories.push(inventory)
        })
        orderList.forEach(order => {
            order.items.forEach(item => {
                drinkMap[item._id].quantity += item.quantity
            })
        })
        Object.values(drinkMap).forEach(drink => {
            drink.recipe.forEach(ingredient => {
                var ingredientMapItem = ingredientMap[ingredient.code]
                ingredientMapItem.orderAmount += ingredient.quantity*drink.quantity
                if(ingredientMapItem.drinks[drink._id])
                    ingredientMapItem.drinks[drink._id].quantity += drink.quantity
                else
                ingredientMapItem.drinks[drink._id] = {
                    quantity: drink.quantity,
                    amountPerDrink: ingredient.quantity,
                    name: drink.name
                }
            })
        })
        Object.values(ingredientMap).forEach(ingredient => {
            var ingredientInfo = ingredient.ingredientInfo
            Object.values(ingredient.drinks).forEach(drink => {
                ingredient.inventories.push({
                    quantity: drink.quantity*drink.amountPerDrink*ingredientInfo.ratio.storage/ingredientInfo.ratio.recipe,
                    description: 'Dùng cho '+drink.name,
                    type: 'out'
                })
            })
            ingredient.amount = ingredient.storageAmount - ingredient.orderAmount*ingredientInfo.ratio.storage/ingredientInfo.ratio.recipe

        })
        console.log(ingredientMap)
        ctx.body = Object.values(ingredientMap)
    }
    else
        httpHelper.setResponseErr(ctx, "Bạn không có quyền xem danh sách nhập/xuất kho!", 403)
})

module.exports = router
