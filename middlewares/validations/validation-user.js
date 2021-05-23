const path = require('path')
const { errorHandler } = require('../../utils/error/errorHelpers')
const { logger } = require('../../helpers/helper-winston')
const { pool } = require('../../config/db')
const {
  HttpError,
  HttpBadRequest,
  HttpUnauthorized,
  HttpForbidden,
  HttpNotFound,
  HttpConflict,
  HttpInternalServerError,
  HttpServiceUnavailable
} = require('../../utils/error/CustomError')

const {
  httpStatusCodes,
  postgresErrorCodes,
  errorTypes
} = require('../../utils/error/constants')

exports.registerUserValidation = async (req, res, next) => {

  try {
    const { user } = req.body

    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/

    if(!emailRegex.test(user.email)) {
      throw new HttpBadRequest(
        'Invalid email address format',
        {
          level: 'warn',
          type: errorTypes.VALIDATION_ERROR,
          url: req.url,
          method: req.method,
          value: user.email,
        })
    }

    // Check if email or username already exist in the BD
    const isExistingUser = await pool.query(
      `
        SELECT email, username FROM users WHERE email = $1 OR username = $2;
      `,
      [user.email, user.username]
    )

    //Check if any user was returned
    if(isExistingUser.rows.length > 0) {
      isExistingUser.rows.map((usr) => {
        // Check if it was an email match
        if(usr.email === user.email) {
          throw new HttpConflict(
            'Email is already in use',
            {
              level: 'warn',
              type: errorTypes.VALIDATION_ERROR,
              url: req.url,
              method: req.method,
            })
        }
        // Check if it was a username match
        if(usr.username === user.username) {
          throw new HttpConflict(
            'Username is already in use',
            {
              level: 'warn',
              type: errorTypes.VALIDATION_ERROR,
              url: req.url,
              method: req.method,
            })
        }
      })
    }

    // Check if the password is within range
    if(user.password.length < 8) {
      throw new HttpBadRequest(
        'Password is too short',
        {
          level: 'warn',
          type: errorTypes.VALIDATION_ERROR,
          url: req.url,
          method: req.method,
        })
    } else if(user.password.length > 128) {
      throw new HttpBadRequest(
        'Password is too long',
        {
          level: 'warn',
          type: errorTypes.VALIDATION_ERROR,
          url: req.url,
          method: req.method,
        }
      )
    }

    // Check if the two password match
    if(user.password !== user.confirmPassword) {
      throw new HttpBadRequest(
        'Passwords don\'t match',
        {
          level: 'warn',
          type: errorTypes.VALIDATION_ERROR,
          url: req.url,
          method: req.method,
        }
      )
    }

    next()

  } catch (error) {
    errorHandler(error, req, res)
  }
}