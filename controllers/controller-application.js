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
        WHERE id = $1 AND user_id != $2 AND vacancies > 0;
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
  const client = await pool.connect()
  await client.query('BEGIN')
  // Get necessary info from request
  const owner = req.body.decoded.id
  const positionId = req.body.position
  const applicant = req.body.applicant

  try {
    // Check if the user is the owner of the project
    const position = await client.query(
      `
        select vacancies, title, project_id
        from positions
        where user_id = $1 and id = $2
      `,
      [owner, positionId]
    )
    // If no project found
    if(position.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Unable to find this position with this owner'
      })
    }
    // If there are no more vacancies left
    if(position.rows[0].vacancies === 0) {
      return res.status(404).json({
        status: 404,
        message: 'There are no available positions left'
      })
    }
    // Deduct one from the vacancies
    await client.query(
      `
        update positions
        set vacancies = vacancies-1
        where id = $1
      `,
      [positionId]
    )

    // Add applicant to the project as collaborator
    await client.query(
      `
        insert into collaborators (position, user_id, project_id)
        values ($1, $2, $3)
      `,
      [position.rows[0].title, applicant, position.rows[0].project_id]
    )

    // Update application in the table to accepted
    await client.query(
      `
        update positions_applications_relations
        set status = 'accepted'
        where user_id = $1 and position_id = $2;
      `,
      [applicant, positionId]
    )

    // Check if any of the positions has vacancies belonging to the project
    const isRecruiting = await client.query(
      `
        select id
        from positions p 
        where project_id = $1 and vacancies > 0;
      `,
      [position.rows[0].project_id]
    )

    // If there are no vacancies left on a project change jobs available to false
    if(isRecruiting.rows.length === 0) {
      await client.query(
        `
        update projects
        set hasPositions = false
        where id = $1
        `,
        [position.rows[0].project_id]
      )
    }

    await client.query('COMMIT')
    return res.status(200).json({
      status: 200,
      message: 'Successfully updated application'
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

exports.declineApplication = async (req, res) => {
  // Get all necessary info from request
  const owner = req.body.decoded.id
  const positionId = req.body.position
  const applicant = req.body.applicant

  try {
    // Get the position by ID
    const position = await pool.query(
      `
        select project_id, user_id
        from positions
        where id = $2
      `,
      [positionId]
    )

    // If no position found
    if(position.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Unable to find this position with this owner'
      })
    }

    // If the user is not the owner of the project
    if(position.rows[0].user_id !== owner) {
      return res.status(401).json({
        status: 401,
        message: 'This application doesn\'t belong to you'
      })
    }

    // Update application to declined
    const updatedApplication = await pool.query(
      `
        update positions_applications_relations
        set status = 'declined'
        where user_id = $1 and position_id = $2 and status = 'pending'
        returning id;
      `,
      [applicant, positionId]
    )

    // If something went wrong
    if (updatedApplication.rows.length === 0) {
      return res.status(500).json({
        status: 500,
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

exports.revokeApplication = async (req, res) => {
  //Get necessary info from request
  const userId = req.body.decoded.id
  const applicationId = req.query.id

  try {
    // Get the application by application ID
    let application = await pool.query(
      `
        SELECT *
        FROM positions_applications_relations
        WHERE id = $1;
      `,
      [applicationId]
    )
    // Simplify application
    application = application.rows

    // If no application fount
    if (application.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'No application found with this ID',
      })
    }

    // Check if the user created the application
    if (application[0].user_id !== userId) {
      return res.status(401).json({
        status: 401,
        message: 'This application doesn\'t belong to you'
      })
    }

    // Delete the application
    await pool.query(
      `
       DELETE FROM positions_applications_relations
       WHERE id = $1;
      `,
      [applicationId]
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully revoked application'
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}