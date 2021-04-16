const { pool } = require('../config/db')
const moment = require('moment')
const format = require('pg-format')

const { insertPositionTech, fetchPositionTech, deletePositionTech } = require('../helpers/helper-queries')

exports.createPosition = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')

  // Get user ID from decoded token
  const userId = req.body.decoded.id

  // Get position details from request
  const position = {
    title: req.body.position.title,
    description: req.body.position.description,
    project: req.body.position.projectId,
    technologies: req.body.position.technologies,
    numberOfPositions: req.body.position.numberOfPositions,
  }

  try {

    // Verify if decoded user is the actual project owner
    const isProjectOwner = await client.query(
      `
        SELECT owner
        FROM projects
        WHERE owner = $1 and id = $2
        LIMIT 1
      `,
      [userId, position.project]
    )

    // If the user is not the project owner
    if(isProjectOwner.rows.length < 1) {
      return res.status(400).json({
        status: 400,
        message: 'No permission to add position to this project'
      })
    }

    // Save position to DB
    const savedPosition = await client.query(
      `
        INSERT INTO positions (title, description, project_id, number_of_positions, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [position.title, position.description, position.project, position.numberOfPositions, userId]
    )

    await client.query(
      `
        UPDATE projects
        SET jobsAvailable = true
        WHERE id = $1
        RETURNING *;
      `,
      [position.project]
    )

    // Add technologies to position
    savedPosition.rows[0].technologies = await insertPositionTech(position.technologies, savedPosition.rows[0].id, client)

    await client.query('COMMIT')
    return res.status(201).json({
      status: 201,
      message: 'position added successfully',
      position: normalizePosition(savedPosition.rows)
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  } finally {
    client.release()
  }
}

exports.getPositionById = async (req, res) => {
  // Get project ID
  const positionId = req.params.id
  try {
    // Get project by ID and join it with tech
    const foundPosition = await pool.query(
      `
        SELECT 
          p.id,
          p.title, 
          p.description,
          p.number_of_positions,
          p.project_id,
          p.user_id,
          p.created_at,
          p.updated_at,
          jsonb_agg(
            jsonb_build_object(
              'label', pt.label, 
              'value', pt.value, 
              'id', pt.technology_id
            )
          ) AS technologies
        FROM position_tech AS pt
        JOIN positions AS p ON p.id = pt.position_id
        WHERE p.id = $1
        GROUP BY p.title, p.id;
      `,
      [positionId]
    )
    // If no positions found
    if(foundPosition.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'No positions found with this ID'
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Position found',
      position: normalizePosition(foundPosition.rows)
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.getPositionsByProject = async (req, res) => {
  try {

    return res.status(200).json({
      status: 200,
      message: 'Get positions by project ID were successful',
      // positions: positionsByProject
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.getAllPositions = async (req, res) => {
  try {

    return res.status(200).json({
      status: 200,
      message: 'Get all projects with filters successful',
      // positions: positionsByProject
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.updatePositionById = async (req, res) => {
  try {

    return res.status(200).json({
      status: 200,
      message: 'Successfully updated position',
      // position: updatedPosition
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.deletePositionById = async (req, res) => {
  try {

    return res.status(200).json({
      status: 200,
      message: 'Successfully deleted position',
      // position: updatedPosition
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

/////////////
// HELPERS //
/////////////

const normalizePosition = (positionsArray) => {
  if(positionsArray.length === 1) {
    const position = positionsArray[0]
    return {
      id: position.id,
      title: position.title,
      description: position.description,
      numberOfPositions: position.number_of_positions,
      projectId: position.project_id,
      userId: position.user_id,
      technologies: position.technologies,
      createdAt: position.created_at,
      updatedAt: position.updated_at
    }
  }

  return positionsArray.map((position) => {
    return {
      id: position.id,
      title: position.title,
      description: position.description,
      numberOfPositions: position.number_of_positions,
      projectId: position.project_id,
      userId: position.user_id,
      technologies: position.technologies,
      createdAt: position.created_at,
      updatedAt: position.updated_at
    }
  })

}