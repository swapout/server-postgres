const { pool } = require('../../config/db')

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
        }
        // Check if it was a username match
        if(usr.username === user.username) {
          validationErrors.usernameInUse = true
        }
      })
    }

    // Check if the password is within range
    if(user.password.length < 8) {
      validationErrors.passwordShort = true
    } else if(user.password.length > 128) {
      validationErrors.passwordLong = true
    }

    // Check if the two password match
    if(user.password !== user.confirmPassword) {
      validationErrors.passwordMatch = true
    }

    // Loop through the validation error object and see if any of them is true
    if(Object.values(validationErrors).includes(true)) {
      return res.status(400).json({
        status: 400,
        message: 'Validation errors',
        validationErrors
      })
    }
    next()

  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}