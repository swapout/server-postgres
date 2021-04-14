const { pool } = require('../config/db')
const moment = require('moment')

exports.createProject = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')

  try {

    await client.query('COMMIT')
    // Success response including the user and token
    return res.status(201).json({
      status: 201,
      message: 'Project created',
      project: 'savedProject'
    })
  } catch (error) {
    // Error handling
    await client.query('ROLLBACK')
    console.log(error.message)
    res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  } finally {
    client.release()
  }
}