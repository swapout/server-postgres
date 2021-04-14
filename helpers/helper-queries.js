const { pool } = require('../config/db')
const format = require('pg-format')

exports.insertUserTech = async (technologiesArray, id, client) => {
  try {
    // Gets technologies corresponding of the array of user technologies
    const technologies = await client.query(
      `
        SELECT id, label, value 
        FROM technologies 
        WHERE label = ANY ($1);
      `,
      [technologiesArray]
    )

    // Assigns technology array to user technologies for the response
    const techIdArray = []
    technologies.rows.map((tech) => {
      techIdArray.push([id, tech.id])
    })

    // Inserts users_technologies_relations to table
    const sqlTech = format(
      `
        INSERT INTO users_technologies_relations (user_id, technology_id)
        VALUES %L;
      `,
      techIdArray
    )
    await client.query(sqlTech)

  } catch (error) {
    console.log('insertUserTech error: ', error.message)
  }
}

exports.insertUserLang = async (languagesArray, id, client) => {
  try {
    // Gets languages corresponding of the array of user languages
    const languages = await client.query(
      `
        SELECT id, label, value 
        FROM languages 
        WHERE label = ANY ($1);
      `,
      [languagesArray]
    )

    // Assigns languages array to user languages for the response
    const langIdArray = []
    languages.rows.map((lang) => {
      langIdArray.push([id, lang.id])
    })

    // Inserts users_languages_relations to table
    const sqlLang = format(
      `
        INSERT INTO users_languages_relations (user_id, language_id)
        VALUES %L;
      `,
      langIdArray
    )
    await client.query(sqlLang)

  } catch (error) {
    console.log('insertUserLang error: ', error.message)
  }
}

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
    console.log('fetchUserTech error: ', error.message)
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
    console.log('fetchUserLang error: ', error.message)
  }
}

exports.deleteUserLang = async (userId, client) => {
  try {
    await client.query(
      `
        DELETE FROM users_languages_relations
        WHERE user_id = $1;
      `, [userId]
    )
  } catch (error) {
    console.log('deleteUserLang error: ', error.message)
  }
}

exports.deleteUserTech = async (userId, client) => {
  try {
    await client.query(
      `
        DELETE FROM users_technologies_relations
        WHERE user_id = $1;
      `, [userId]
    )
  } catch (error) {
    console.log('deleteUserTech error: ', error.message)
  }
}