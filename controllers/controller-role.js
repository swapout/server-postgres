const { pool } = require('../config/db')

exports.listRoles = async (req, res) => {
  try {
    let roles = await pool.query(
      `
        SELECT label, id 
        FROM roles
        WHERE status = 'accepted'
      `
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully listed roles',
      roles: roles.rows
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.requestRole = async (req, res) => {
  const roleLabel = req.body.role
  try {
    const savedRole = await pool.query(
      `
        INSERT INTO roles (label)
        VALUES ($1)
        RETURNING *;
      `,
      [roleLabel]
    )

    if(savedRole.rows.length === 0) {
      return res.status(500).json({
        status: 500,
        message: 'Something went wrong'
      })
    }

    return res.status(201).json({
      status: 201,
      message: 'Requested role is awaiting for moderation'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}