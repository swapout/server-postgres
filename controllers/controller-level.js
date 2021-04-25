const { pool } = require('../config/db')

exports.listLevels = async (req, res) => {
  try {
    let levels = await pool.query(
      `
        SELECT label, value, id FROM levels
      `
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully listed levels',
      levels: levels.rows
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}