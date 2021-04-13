const { pool } = require('../config/db')

exports.fetchUserTech = async (userId) => {
  try {
    const tech = await pool.query(
      `
        SELECT label, value , technology_id AS id
        FROM user_tech AS ut
        WHERE user_id = $1;
      `, [userId]
    )
    return tech.rows
  } catch (error) {
    console.log('fetchTech error: ', error.message)
  }
}

exports.fetchUserLang = async (userId) => {
  try {
    const lang = await pool.query(
      `
        SELECT label, value, language_id AS id
        FROM user_lang AS ulr
        WHERE user_id = $1;
      `, [userId]
    )
    return lang.rows
  } catch (error) {
    console.log('fetchLang error: ', error.message)
  }
}