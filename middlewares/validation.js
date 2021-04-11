// const knex = require('../config/db')

exports.registerUserValidation = async (req, res, next) => {
  try {
  //   const { user } = req.body
  //
  //   // Check if email is already registered
  //   const isExistingEmail = await knex
  //     .select('user_id')
  //     .from('user')
  //     .where("email", user.email)
  //     .limit(1)
  //
  //   // Check if username is already registered
  //   const isExistingUsername = await knex
  //     .select('user_id')
  //     .from('user')
  //     .where("username", user.username)
  //     .limit(1)
  //
  //   // Based on the last the MySQL queries send an error response
  //   if (isExistingEmail.length > 0 && isExistingUsername.length > 0) {
  //     return res.status(409).json({
  //       status: 409,
  //       message: 'Email and username are already in use'
  //     })
  //   } else if (isExistingEmail.length > 0) {
  //     return res.status(409).json({
  //       status: 409,
  //       message: 'Email is already in use'
  //     })
  //   } else if (isExistingUsername.length > 0) {
  //     return res.status(409).json({
  //       status: 409,
  //       message: 'Username is already in use'
  //     })
  //   }
  //
  //   // Check if the original password is long enough
  //   if(user.password.length < 8) {
  //     return res.status(400).json({
  //       status: 400,
  //       message: 'Password is too short'
  //     })
  //   }
  //
  //   // Check if the original password is not too long
  //   if(user.password.length > 128) {
  //     return res.status(400).json({
  //       status: 400,
  //       message: 'Password is too long'
  //     })
  //   }
  //
  //   // Compare passwords
  //   if(user.password !== user.confirmPassword) {
  //     return res.status(400).json({
  //       status: 400,
  //       message: 'Passwords do not match'
  //     })
  //   }
  //
  //   next()
  //
  } catch (error) {
  //   console.log(error.message)
  //   res.status(500).json({
  //     status: 500,
  //     message: 'Server error'
  //   })
  }
}