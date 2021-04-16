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
  const projectId = req.params.id
  try {

    const foundPositions = await pool.query(
      `
        SELECT p.id,
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
        FROM positions p
        JOIN position_tech AS pt ON pt.position_id = p.id
        WHERE p.project_id = $1
        GROUP BY p.title, p.id
        ORDER BY title ASC;
      `,
      [projectId]
    )

    if(foundPositions.rows.length === 0) {
      return res.status(200).json({
        status: 200,
        message: 'This project doesn\'t have positions',
        positions: foundPositions.rows
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Get positions by project ID were successful',
      positions: foundPositions.rows
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
  // Create DB connection pool and start transaction
  const client = await pool.connect()
  await client.query('BEGIN')
  // Get position ID
  const positionId = req.params.id
  // Get user ID from token
  const userId = req.body.decoded.id
  // Prepare position for update
  const position = {
    title: req.body.position.title,
    description: req.body.position.description,
    numberOfPositions: req.body.position.numberOfPositions,
    projectId: req.body.position.projectId,
    technologies: req.body.position.technologies,
    updatedAt: moment()
  }

  const foundProject = await client.query(
    `
      SELECT id
      FROM projects
      WHERE id = $1 AND owner = $2
    `,
    [position.projectId, userId]
  )

  if (foundProject.rows.length === 0) {
    return res.status(403).json({
      status: 403,
      message: 'You are not authorized to edit this project'
    })
  }

  try {
    const updatedPosition = await client.query(
      `
        UPDATE positions
        SET title = $1, 
            description = $2, 
            number_of_positions = $3, 
            updated_at = $4
        WHERE id = $5 AND user_id = $6
        RETURNING id, title, description, number_of_positions, project_id, user_id, created_at, updated_at
      `,
      [position.title, position.description, position.numberOfPositions, position.updatedAt, positionId, userId]
    )

    await deletePositionTech(updatedPosition.rows[0].id, client)
    updatedPosition.rows[0].technologies = await insertPositionTech(position.technologies, updatedPosition.rows[0].id, client)

    await client.query('COMMIT')
    return res.status(200).json({
      status: 200,
      message: 'Successfully updated position',
      position: normalizePosition(updatedPosition.rows)
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

exports.deletePositionById = async (req, res) => {
  // Get position ID from the query string
  const positionId = req.params.id
  // Get the user ID from the token
  const userId = req.body.decoded.id
  try {
    // Delete position where user is owner of the position
    const deletedPosition = await pool.query(
      `
        DELETE FROM positions
        WHERE id = $1 AND user_id = $2
        RETURNING *;
      `,
      [positionId, userId]
    )

    if(deletedPosition.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Something went wrong',
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Successfully deleted position',
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