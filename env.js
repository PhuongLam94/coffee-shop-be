module.exports = {
    'local': {
        'MONGO_URL': "mongodb://localhost:27017",
        'DB_NAME': 'koa-first-project'
    },
    'production': {
        'MONGO_URL': "mongodb+srv://phuonglam:YKpUdQjiwYsIrP84@cluster0-hkmen.mongodb.net/test?retryWrites=true&w=majority",
        'DB_NAME': 'coffee-shop'
    }
}