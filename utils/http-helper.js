function handlResultDB(ctx, result, sucessMsg){
    if (result.result.ok === 1){
        setResponseBody(ctx, {message: sucessMsg})
    } else {
        setResponseErr(ctx)

    }
}
function setResponseBody(ctx, responseBody, status=200 ){
    ctx.status = status
    ctx.body = responseBody
}
function setResponseErr(ctx, message="Error happened.", status=400){
    setResponseBody(ctx, {message: message}, status)
}
module.exports = { setResponseBody: setResponseBody,
                   setResponseErr: setResponseErr,
                   handlResultDB: handlResultDB }