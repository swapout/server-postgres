const { pool } = require('../config/db')
const moment = require('moment')

const { insertProjectTech } = require('../helpers/helper-queries')

exports.createProject = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')
  // Gets user ID
  const { id } = req.body.decoded
  // Gets project details from front-end
  const { project } = req.body

  try {
    let savedProject = await client.query(
      `
        INSERT INTO projects (name, description, projectURL, owner)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `,
      [project.name, project.description, project.projectURL, id]
    )
    
    savedProject = savedProject.rows[0]

    savedProject.technologies = await insertProjectTech(project.technologies, savedProject.id, client)

    await client.query('COMMIT')
    // Success response including the user and token
    return res.status(201).json({
      status: 201,
      message: 'Project created',
      project: savedProject
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