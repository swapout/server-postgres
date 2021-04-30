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
    level: req.body.position.level,
    role: req.body.position.role,
    technologies: req.body.position.technologies,
    vacancies: req.body.position.vacancies,
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

    // Check if technologies are in project technologies
    const sql = format(
      `
        select *
        from projects p
        join (
            select array_agg(technology_id)::text[] as tech, project_id
            from projects_technologies_relations
            group by project_id
        ) as ptr on ptr.project_id = p.id
        where ptr.tech @> array[%1$L] and p.id = %2$L;
      `,
      position.technologies, position.project
    )
    const isProjectIncludesTech = await client.query(sql)

    // If technologies are not included in the project
    if (!isProjectIncludesTech.rows.length) {
      return res.status(401).json({
        status: 401,
        message: 'Technologies are not in project'
      })
    }

    // Save position to DB
    const savedPosition = await client.query(
      `
        INSERT INTO positions (
            title, 
            description, 
            project_id, 
            vacancies, 
            user_id, 
            level, 
            role
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        position.title,
        position.description,
        position.project,
        position.vacancies,
        userId,
        position.level,
        position.role
      ]
    )

    // Change project has positions to true
    await client.query(
      `
        UPDATE projects
        SET hasPositions = true
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
          p.level,
          p.role,
          p.vacancies,
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
        WHERE p.id = $1 and p.vacancies > 0
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
  // Get project ID
  const projectId = req.params.id
  try {
    // Get positions belonging to a project and has vacancies
    const foundPositions = await pool.query(
      `
        SELECT p.id,
               p.title,
               p.description,
               p.level,
               p.role,
               p.vacancies,
               p.project_id,
               p.user_id,
               p.created_at,
               p.updated_at,
               jsonb_agg(
                  pt.label
                ) AS technologies
        FROM positions p
        JOIN position_tech AS pt ON pt.position_id = p.id
        WHERE p.project_id = $1 and p.vacancies > 0
        GROUP BY p.title, p.id
        ORDER BY title ASC;
      `,
      [projectId]
    )

    //If no project found
    if(foundPositions.rows.length === 0) {
      return res.status(200).json({
        status: 200,
        message: 'This project doesn\'t have positions',
        positions: []
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Get positions by project ID were successful',
      positions: normalizePosition(foundPositions.rows, true)
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
    // TODO: Finish this after everything is setup on the project

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
    level: req.body.position.level,
    role: req.body.position.role,
    vacancies: req.body.position.vacancies,
    projectId: req.body.position.projectId,
    technologies: req.body.position.technologies,
    updatedAt: moment()
  }

  try {

    // Verify that the user is the project owner
    const foundProject = await client.query(
      `
      SELECT id
      FROM projects
      WHERE id = $1 AND owner = $2
    `,
      [position.projectId, userId]
    )

    // If no projects found with this criteria
    if (foundProject.rows.length === 0) {
      return res.status(403).json({
        status: 403,
        message: 'You are not authorized to edit this project'
      })
    }

    // Update position with new values
    const updatedPosition = await client.query(
      `
        UPDATE positions
        SET title = $1, 
            description = $2,
            level = $7,
            role = $8, 
            vacancies = $3, 
            updated_at = $4
        WHERE id = $5 AND user_id = $6
        RETURNING id, title, description, level, role, vacancies, project_id, user_id, created_at, updated_at
      `,
      [position.title, position.description, position.vacancies, position.updatedAt, positionId, userId, position.level, position.role]
    )

    // Delete old technologies relations
    await deletePositionTech(updatedPosition.rows[0].id, client)
    // Add new technologies to relations
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

    // If no positions got deleted
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

const normalizePosition = (positionsArray, isArray = false) => {
  if(positionsArray.length === 1 && !isArray) {
    const position = positionsArray[0]
    return {
      id: position.id,
      title: position.title,
      description: position.description,
      role: position.role,
      level: position.level,
      vacancies: position.vacancies,
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
      role: position.role,
      level: position.level,
      vacancies: position.vacancies,
      projectId: position.project_id,
      userId: position.user_id,
      technologies: position.technologies,
      createdAt: position.created_at,
      updatedAt: position.updated_at
    }
  })

}