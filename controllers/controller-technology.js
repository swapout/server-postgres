const { pool } = require('../config/db')

exports.listTechnologies = async (req, res) => {
  try {
    let technologies = await pool.query(
      `
        SELECT label, value, id FROM technologies
      `
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully listed technologies',
      technologies: technologies.rows
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}