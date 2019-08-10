function handleResultDB(ctx, result, sucessMsg){
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
function setResponseErr(ctx, message="Có lỗi xảy ra!", status=400){
    setResponseBody(ctx, {message: message}, status)
}
module.exports = { setResponseBody: setResponseBody,
                   setResponseErr: setResponseErr,
                   handleResultDB: handleResultDB }