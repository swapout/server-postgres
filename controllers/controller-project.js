const { pool } = require('../config/db')
const moment = require('moment')

const { insertProjectTech, fetchProjectTech, deleteProjectTech } = require('../helpers/helper-queries')

exports.createProject = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')
  // Get user ID
  const { id } = req.body.decoded
  // Get project details from front-end
  const { project } = req.body

  try {
    // Save project into DB
    let savedProject = await client.query(
      `
        INSERT INTO projects (name, description, projectURL, owner)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `,
      [project.name, project.description, project.projectURL, id]
    )

    // Simplify project
    savedProject = savedProject.rows[0]

    // Add technologies to project
    savedProject.technologies = await insertProjectTech(project.technologies, savedProject.id, client)

    await client.query('COMMIT')
    // Success response including the project
    return res.status(201).json({
      status: 201,
      message: 'Project created',
      project: shapeProjectResponse(savedProject)
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

exports.getProjectById = async (req, res) => {
  // Get project ID
  const projectId = req.params.id

  try {
    // Get project by projectId
    let foundProject = await pool.query(
      `
        SELECT *
        FROM projects
        WHERE id = $1;
      `,
      [projectId]
    )

    // If no project found
    if (foundProject.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Project not found'
      })
    }
    // Simplify project
    foundProject = foundProject.rows[0]

    // Get technologies belonging to the project
    foundProject.technologies = await fetchProjectTech(projectId)

    return res.status(200).json({
      status: 200,
      message: 'Successfully retrieved project',
      project: shapeProjectResponse(foundProject)
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

const shapeProjectResponse = (project) => {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    projectURL: project.projecturl,
    jobsAvailable: project.jobsavailable,
    owner: project.owner,
    technologies: project.technologies,
    created_at: project.created_at,
    updated_at: project.updated_at
  }
}