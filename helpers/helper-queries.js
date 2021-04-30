const { pool } = require('../config/db')
const format = require('pg-format')

//////////////////
// USER HELPERS //
/////////////////

exports.insertUserTech = async (technologiesArray, id, client) => {
  try {
    // Gets technologies corresponding of the array of user technologies
    const technologies = await client.query(
      `
        SELECT id, label, value 
        FROM technologies 
        WHERE id = ANY ($1);
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
    return technologies.rows
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
        WHERE id = ANY ($1);
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
    return languages.rows
  } catch (error) {
    console.log('insertUserLang error: ', error.message)
  }
}

exports.fetchUserTech = async (userId) => {
  try {
    const tech = await pool.query(
      `
        SELECT label, value, technology_id AS id
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

/////////////////////
// PROJECT HELPERS //
////////////////////

exports.insertProjectTech = async (technologiesArray, projectId, client) => {
  try {
    // Gets technologies corresponding of the array of project technologies
    const technologies = await client.query(
      `
        SELECT id, label, value 
        FROM technologies 
        WHERE id = ANY ($1);
      `,
      [technologiesArray]
    )

    // Assigns technology array to project technologies for the response
    const techIdArray = []
    technologies.rows.map((tech) => {
      techIdArray.push([projectId, tech.id])
    })

    // Inserts projects_technologies_relations to table
    const sqlTech = format(
      `
        INSERT INTO projects_technologies_relations (project_id, technology_id)
        VALUES %L;
      `,
      techIdArray
    )
    await client.query(sqlTech)
    return technologies.rows
  } catch (error) {
    console.log('insertProjectTech error: ', error.message)
  }
}

exports.fetchProjectTech = async (projectId) => {
  try {
    const tech = await pool.query(
      `
        SELECT label, value, technology_id AS id
        FROM project_tech AS pt
        WHERE project_id = $1;
      `, [projectId]
    )
    return tech.rows
  } catch (error) {
    console.log('fetchProjectTech error: ', error.message)
  }
}

exports.deleteProjectTech = async (projectId, client) => {
  try {
    await client.query(
      `
        DELETE FROM projects_technologies_relations
        WHERE project_id = $1;
      `, [projectId]
    )
  } catch (error) {
    console.log('deleteProjectTech error: ', error.message)
  }
}

//////////////////////
// POSITION HELPERS //
/////////////////////

exports.insertPositionTech = async (technologiesArray, positionId, client) => {
  try {
    // Gets technologies corresponding of the array of project technologies
    const technologies = await client.query(
      `
        SELECT id, label, value 
        FROM technologies 
        WHERE id = ANY ($1);
      `,
      [technologiesArray]
    )

    // Assigns technology array to project technologies for the response
    const techIdArray = []
    technologies.rows.map((tech) => {
      techIdArray.push([positionId, tech.id])
    })

    // Inserts projects_technologies_relations to table
    const sqlTech = format(
      `
        INSERT INTO positions_technologies_relations (position_id, technology_id)
        VALUES %L;
      `,
      techIdArray
    )
    await client.query(sqlTech)
    return technologies.rows
  } catch (error) {
    console.log('insertPositionTech error: ', error.message)
  }
}

exports.fetchPositionTech = async (positionId) => {
  try {
    const tech = await pool.query(
      `
        SELECT label, value, technology_id AS id
        FROM position_tech AS pt
        WHERE position_id = $1;
      `, [positionId]
    )
    return tech.rows
  } catch (error) {
    console.log('fetchPositionTech error: ', error.message)
  }
}

exports.deletePositionTech = async (positionId, client) => {
  try {
    await client.query(
      `
        DELETE FROM positions_technologies_relations
        WHERE position_id = $1;
      `, [positionId]
    )
  } catch (error) {
    console.log('deletePositionTech error: ', error.message)
  }
}