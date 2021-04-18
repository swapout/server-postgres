const { pool } = require('../config/db')

exports.listLanguages = async (req, res) => {
  try {
    let languages = await pool.query(
      `
        SELECT label, value, id FROM languages
      `
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully listed languages',
      technologies: languages.rows
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}