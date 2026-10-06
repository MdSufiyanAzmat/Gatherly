const jwt = require('jsonwebtoken')
const User = require('../models/user')

const getBearerToken = (req) => (
    req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null
)

const protect = async (req, res, next)=> {
    const token = getBearerToken(req)

    if(token){
        try{
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            req.user = await User.findById(decoded.id).select('-password')
            if(!req.user){
                return res.status(401).json({success: false, data: null, message: "Not authorized! User not found."})
            }
            next()
        }catch(error){
            return res.status(401).json({success: false, data: null, message: "Token failed"})
        }
    }else{
        return res.status(401).json({success: false, data: null, message: "No token found"})
    }
}

const optionalAuth = async (req, res, next) => {
    const token = getBearerToken(req)
    if (!token) return next()

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        const user = await User.findById(decoded.id).select('-password')
        if (!user) {
            return res.status(401).json({success: false, data: null, message: 'Not authorized! User not found.'})
        }
        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({success: false, data: null, message: 'Token failed'})
    }
}

const adminOnly = (req, res, next) => {
    if(req.user && req.user.role === 'admin'){
        next()
    }else{
        return res.status(403).json({success: false, data: null, message: "Access denied! Admin access required."})
    }
}

module.exports = {protect, optionalAuth, adminOnly, admin: adminOnly}
