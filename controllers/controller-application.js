const { pool } = require('../config/db')
const moment = require('moment')
const format = require('pg-format')

exports.createApplication = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')

  // Get user and position ID
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

    // If no item found
    if(isPositionOwner.rows.length === 0) {
      return res.status(422).json({
        status: 422,
        message: 'You can\'t apply for this position'
      })
    }

    // Add application to table
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
  // Get necessary info to get the applications
  const status = req.query.status
  const positionId = req.params.position
  const userId = req.body.decoded.id

  try {
    // Get all applications for a position
    const foundApplications = await pool.query(
      `
        select u.avatar, u.username, u.bio, u.githuburl, u.gitlaburl, u.bitbucketurl, u.linkedinurl
        from positions_applications_relations par 
        join positions p on par.position_id = p.id
        join users u on u.id = par.user_id 
        where par.position_id = $1 and p.user_id = $2 and par.status = $3
        order by par.created_at asc;
      `,
      [positionId, userId, status]
    )

    // If no applications found
    if (foundApplications.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'You are either not the project owner or there are no applications found'
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

exports.acceptApplication = async (req, res) => {
  const owner = req.body.decoded.id
  const positionId = req.body.position
  const applicant = req.body.applicant

  try {
    const position = await pool.query(
      `
        select number_of_positions, title, project_id
        from positions
        where user_id = $1 and id = $2
      `,
      [owner, positionId]
    )

    if(position.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Unable to find this position with this owner'
      })
    }

    if(position.rows[0].number_of_positions === 0) {
      return res.status(404).json({
        status: 404,
        message: 'There are no available positions left'
      })
    }

    await pool.query(
      `
        update positions
        set number_of_positions = number_of_positions-1
        where id = $1
      `,
      [positionId]
    )

    await pool.query(
      `
        insert into collaborators (position, user_id, project_id)
        values ($1, $2, $3)
      `,
      [position.rows[0].title, applicant, position.rows[0].project_id]
    )

    await pool.query(
      `
        update positions_applications_relations
        set status = 'accepted'
        where user_id = $1 and position_id = $2;
      `,
      [applicant, positionId]
    )

    const isRecruiting = await pool.query(
      `
        select id
        from positions p 
        where project_id = $1 and number_of_positions > 1;
      `,
      [position.rows[0].project_id]
    )

    if(isRecruiting.rows.length === 0) {
      await pool.query(
        `
        update projects
        set jobs_available = false
        where id = $1
        `,
        [position.rows[0].project_id]
      )
    }

    return res.status(200).json({
      status: 200,
      message: 'Successfully updated application'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.declineApplication = async (req, res) => {
  const owner = req.body.decoded.id
  const positionId = req.body.position
  const applicant = req.body.applicant

  try {
    const position = await pool.query(
      `
        select project_id
        from positions
        where user_id = $1 and id = $2
      `,
      [owner, positionId]
    )

    if(position.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Unable to find this position with this owner'
      })
    }

    const updatedApplication = await pool.query(
      `
        update positions_applications_relations
        set status = 'declined'
        where user_id = $1 and position_id = $2 and status = 'pending'
        returning id;
      `,
      [applicant, positionId]
    )

    if (updatedApplication.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Unable to update this application'
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Successfully updated application'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}