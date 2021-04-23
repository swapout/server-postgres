const { pool } = require('../config/db')

exports.listRoles = async (req, res) => {
  try {
    let roles = await pool.query(
      `
        SELECT label, value, id FROM roles
      `
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully listed roles',
      technologies: roles.rows
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}