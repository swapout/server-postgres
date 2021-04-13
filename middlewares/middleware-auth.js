const jwt = require('jsonwebtoken')
const config = require('config')

/**
 * Authentication middleware,
 * It accepts a Bearer token in the request header, verifies the token validity
 * and will call next function or return an auth error.
 * @param {Request} req - Request object from express router
 * @param {object} req.query.id - user id
 * @param {object} res - Response object from express router
 * @param {function} next
 * @access Private
 * @author Gabor
 */
exports.auth = async (req, res, next) => {
  try {
    // Gets token from header
    const token = req.headers.authorization?.split(' ')[1]

    // Gets token secret
    const bearerTokenSecret = config.get('bearerTokenSecret')

    // Checks if token exists
    if (!token) {
      return res.status(401).json({
        status: 401,
        message: 'Authentication error'
      })
    }
    // Checks if secret exists
    if(!bearerTokenSecret) {
      return res.status(500).json({
        status: 500,
        message: 'Server error'
      })
    } else {
      // If everything ok, verifies the token
      const decoded = jwt.verify(token, bearerTokenSecret)

      // If not verified
      if(!decoded) {
        return res.status(401).json({
          status: 401,
          message: 'Authentication error'
        })
      }
      // Saves decoded values into req.body.decoded
      req.body.decoded = decoded
      req.body.token = token
      next()
    }
  } catch (error) {
    console.log(error.name)
    // Checks for JWT token validation error
    if(error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 401,
        message: 'Authentication error'
      })
    }
    // General error handling
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}