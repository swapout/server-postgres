const path = require('path')
const { logger } = require('../../helpers/helper-winston')
const { pool } = require('../../config/db')

const relativePath = `${path.relative(process.cwd(), path.join(__dirname,))}/${path.basename(__filename)}`

exports.registerUserValidation = async (req, res, next) => {

  try {
    const { user } = req.body

    // Create validation error object to track errors
    const validationErrors = {
      invalidEmail: false,
      emailInUse: false,
      usernameInUse: false,
      passwordShort: false,
      passwordLong: false,
      passwordMatch: false,
    }

    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/
    validationErrors.invalidEmail = !emailRegex.test(user.email)

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
          validationErrors.emailInUse = true
          logger.log(
            'warn',
            'Email is already in use',
            {
              url: req.url,
              method: req.method,
              status: 409,
              file: relativePath,
              value: usr.email,
              type: 'duplicate error'
            }
          )
        }
        // Check if it was a username match
        if(usr.username === user.username) {
          validationErrors.usernameInUse = true
          logger.warn(
            'Username is already in use',
            {
              url: req.url,
              method: req.method,
              status: 409,
              file: relativePath,
              value: usr.username,
              type: 'duplicate error'
            }
          )
        }
      })
    }

    // Check if the password is within range
    if(user.password.length < 8) {
      validationErrors.passwordShort = true
      logger.warn(
        'Password is too short',
        {
          url: req.url,
          method: req.method,
          status: 409,
          file: relativePath,
          type: 'validation error'
        }
      )
    } else if(user.password.length > 128) {
      validationErrors.passwordLong = true
      logger.warn(
        'Password is too long',
        {
          url: req.url,
          method: req.method,
          status: 409,
          file: relativePath,
          type: 'validation error'
        }
      )
    }

    // Check if the two password match
    if(user.password !== user.confirmPassword) {
      validationErrors.passwordMatch = true
      logger.warn(
        'Passwords do not match',
        {
          url: req.url,
          method: req.method,
          status: 409,
          file: relativePath,
          type: 'validation error'
        }
      )
    }

    // Loop through the validation error object and see if any of them is true
    if(Object.values(validationErrors).includes(true)) {
      return res.status(409).json({
        status: 409,
        message: 'Validation errors',
        validationErrors
      })
    }
    next()

  } catch (error) {
    console.log(error.message)
    logger.error(
      error.message,
      {
        url: req.url,
        method: req.method,
        status: 500,
        file: relativePath,
        type: 'server error',
        value: error.value
      }
    )
    return res.status(500).json({
      status: 500,
      message: error.message,
    })
  }
}