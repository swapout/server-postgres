const jwt = require('jsonwebtoken')
const config = require('config')

exports.createAndSaveBearerToken = async(user, res, pool) => {
  try {
    // Create and sign the bearer token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.username },
      config.get('bearerTokenSecret')
    )

    // Insert token into bearer_tokens table
    const bearer_token = await pool.query(
      `
        INSERT INTO bearer_tokens (bearer_token, user_id)
        VALUES ($1, $2)
        RETURNING bearer_token
        `,
      [token, user.id]
    )

    // If no token was created
    if(bearer_token.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Something went wrong, please try again'
      })
    }
    return bearer_token.rows[0].bearer_token
  } catch (error) {
    console.log('createAndSaveBearerToken error: ', error.message)
  }
}