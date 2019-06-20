require('dotenv').config()
const jwt = require('jsonwebtoken')

const verifyToken = async (req, res, next) => {
    // console.log(req.headers)

    let token = req.headers['x-access-token']
    if(!token) {
        return res.status(401).json({ auth: false, message: 'No token provided.'});
    }
    
    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.HASHSECRET)
        console.log(decoded)
        req.user_id = decoded.user_id

    } catch (err) {
        return res.status(500).json({ auth: false, message: 'Failed to authenticate with token.'})
    }

    next();
}

module.exports = verifyToken;