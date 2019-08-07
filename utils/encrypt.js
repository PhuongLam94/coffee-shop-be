const crypto = require('crypto')
const SECRET = "abcxyzmnk"


function encryptSHA256(stringToEncrypt){
    return crypto.createHmac('sha256', SECRET)
                .update(stringToEncrypt)
                .digest('hex')
}

module.exports = encryptSHA256