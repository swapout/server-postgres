const { pool } = require('../config/db')

exports.fetchUserTech = async (userId) => {
  try {
    const tech = await pool.query(
      `
        SELECT label, value, t.id 
        FROM users_technologies_relations AS utr
        JOIN technologies AS t ON t.id = utr.technology_id
        JOIN users AS u ON u.id = utr.user_id
        WHERE u.id = $1;
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
        SELECT label, value, l.id, l.code
        FROM users_languages_relations AS ulr
        JOIN languages AS l ON l.id = ulr.language_id
        JOIN users AS u ON u.id = ulr.user_id
        WHERE u.id = $1;
      `, [userId]
    )
    return lang.rows
  } catch (error) {
    console.log('fetchLang error: ', error.message)
  }
}