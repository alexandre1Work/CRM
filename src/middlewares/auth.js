const jwt = require('jsonwebtoken')

function checkToken(req, res, next){

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token){
        return res.redirect('/login')
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET)
        req.userId = decoded.id
        next()
    } catch (error) {
        res.status(400).json({msg: "Token Inválido"})
    }
}

module.exports = {
    checkToken
}