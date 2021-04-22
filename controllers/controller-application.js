const { pool } = require('../config/db')
const moment = require('moment')
const format = require('pg-format')

exports.createApplication = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')

  const userId = req.body.decoded.id
  const positionId = req.body.position
  try {
  // Make sure that the user is not the owner of the project
  // So they can't apply for their own project
  // Check if the position still accepts applications
    const isPositionOwner = await client.query(
      `
        SELECT  id
        FROM positions
        WHERE id = $1 AND user_id != $2 AND number_of_positions > 0;
      `,
      [positionId, userId]
    )

    if(isPositionOwner.rows.length === 0) {
      return res.status(422).json({
        status: 422,
        message: 'You can\'t apply for this position'
      })
    }

    await client.query(
      `
        INSERT INTO positions_applications_relations (user_id, position_id)
        VALUES ($1, $2)
      `,
      [userId, positionId]
    )

    await client.query('COMMIT')
    return res.status(201).json({
      status: 201,
      message: 'Applied successfully to position',
    })
  } catch (error) {
    console.log(error)
    await client.query('ROLLBACK')
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  } finally {
    client.release()
  }
}

exports.getApplicationsByPosition = async (req, res) => {
  const status = req.query.status
  const positionId = req.params.position
  const userId = req.body.decoded.id
  console.log(status)
  console.log(positionId)
  console.log(userId)
  try {
    const foundApplications = await pool.query(
      `
        select u.avatar, u.username, u.bio, u.githuburl, u.gitlaburl, u.bitbucketurl, u.linkedinurl 
        from positions_applications_relations par 
        join positions p on par.position_id = p.id
        join users u on u.id = p.user_id 
        where par.position_id = $1 and p.user_id = $2 and par.status = $3
      `,
      [positionId, userId, status]
    )

    console.log(foundApplications.rows)
    if (foundApplications.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'You are either not the project owner or there ar no applications found'
      })
    }
    return res.status(200).json({
      status: 200,
      message: 'Successfully retrieved applicants by position',
      applicants: foundApplications.rows
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}