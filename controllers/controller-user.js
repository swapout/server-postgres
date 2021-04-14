const { pool } = require('../config/db')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const {
  insertUserTech,
  insertUserLang,
  fetchUserTech,
  fetchUserLang,
  deleteUserLang,
  deleteUserTech
} = require('../helpers/helper-queries')
const { createAndSaveBearerToken } = require('../helpers/helper-tokens')

exports.createUser = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')

  try {
    let user = req.body.user

    // Hash password
    user.password = await bcrypt.hash(user.password, 11)

    // Get avatar from Gravatar
    const avatar = await gravatar.url(user.email, {
      s: '200',
      r: 'pg',
      d: 'mm',
    })

    // Construct Gravatar URL
    user.avatar = `https:${avatar}`

    // Verify and create social profiles
    user = verifyAndCreateSocial(user)

    // Inserts user into user table
    const response = await client.query(
      `
        INSERT INTO users (avatar, username, email, password, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id, avatar, username, email, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at;
        `,
      [user.avatar, user.username, user.email, user.password, user.githubURL, user.gitlabURL, user.bitbucketURL, user.linkedinURL, user.bio])

    // Simplify savedUser
    const savedUser = response.rows[0]

    // Create and save bearer_token to DB
    const bearer_token = await createAndSaveBearerToken(savedUser, res, client)

    // Insert technologies and languages to DB and receive the formatted arrays back
    savedUser.technologies = await insertUserTech(user.technologies, savedUser.id, client)
    savedUser.languages = await insertUserLang(user.languages, savedUser.id, client)

    await client.query('COMMIT')
    // Success response including the user and token
    return res.status(201).json({
      status: 201,
      message: 'User created',
      token: bearer_token,
      user: shapeUserResponse(savedUser)
    })

  } catch (error) {
    // console.log('Error.code: ', error.code)
    // console.log('Error.errno: ', error.errno)
    // console.log('Error.sqlMessage: ', error.sqlMessage)
    // console.log('Error.sqlState: ', error.sqlState)
    // console.log('Error.index: ', error.index)
    // console.log('Error.sql: ', error.sql)
    // console.log(Object.keys(error))

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

exports.loginUser = async (req, res) => {
  try {
    // Save user input to user obj
    const user = {
      email: req.body.user.email,
      password: req.body.user.password
    }

    // Find user by ID
    let foundUser = await pool.query(
      `
        SELECT * FROM users WHERE email = $1 LIMIT 1;
      `, [user.email]
    )

    // Check if there was a user with this email
    if(!foundUser) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials'
      })
    }

    // Simplify found user
    foundUser = foundUser.rows[0]

    // Compare passwords
    const isPasswordsMatch = await bcrypt.compare(user.password, foundUser.password)

    // If password don't match
    if(!isPasswordsMatch) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials'
      })
    }

    //Delete password information from foundUser
    delete foundUser.password

    // Find user's languages and add them to foundUser
    foundUser.languages = await fetchUserLang(foundUser.id)

    // Find user's technologies and add them to foundUser
    foundUser.technologies = await fetchUserTech(foundUser.id)

    // Create and save bearer token to the DB
    const bearer_token = await createAndSaveBearerToken(foundUser, res, pool)

    // Success response including the user and token
    return res.status(200).json({
      status: 200,
      message: 'Login success',
      token: bearer_token,
      user: shapeUserResponse(foundUser)
    })

  } catch (error) {
    // Error handling
    console.log(error.message)
    res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.getUserProfile = async (req, res) => {
  try {
    // Gets user ID
    const id = req.body.decoded.id

    let foundUser = await pool.query(
      `
        SELECT id, avatar, username, email, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at 
        FROM users 
        WHERE users.id = $1
        LIMIT 1;
      `,
      [id]
    )

    if(foundUser.rows.length === 0) {
      return res.status(403).json({
        status: 403,
        message: 'Not authorized'
      })
    }

    foundUser = foundUser.rows[0]

    // Find user's languages and add them to foundUser
    foundUser.languages = await fetchUserLang(foundUser.id)

    // Find user's technologies and add them to foundUser
    foundUser.technologies = await fetchUserTech(foundUser.id)

    return res.status(200).json({
      status: 200,
      message: `Profile of ${foundUser.username}`,
      user: shapeUserResponse(foundUser)
    })
  } catch (error) {
    // Error handling
    console.log(error.message)
    res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.deleteUser = async (req, res) => {
  // Create connection and start a transaction
  const client = await pool.connect()
  await client.query('BEGIN')

  try {
    // Gets user ID
    const id = req.body.decoded.id
    // Delete a user with the user ID from the decoded token
    await client.query(
      `
        DELETE FROM users WHERE id = $1;
      `,
      [id]
    )
    // If everything went well, commit the changes to the DB
    await client.query('COMMIT')
    return res.status(200).json({
      status: 200,
      message: 'User is deleted'
    })
  } catch (error) {
    // If something went wrong, rollback all the changes in the DB
    await client.query('ROLLBACK')
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  } finally {
    // Terminate connection
    client.release()
  }
}

exports.updateUser = async (req, res) => {
  // Create connection and start a transaction
  const client = await pool.connect()
  await client.query('BEGIN')

  try {
    // Gets user ID
    const id = req.body.decoded.id

    // Create the user object from user input
    let user = {
      bio: req.body.user.bio,
      githubURL: req.body.user.githubURL,
      gitlabURL: req.body.user.gitlabURL,
      bitbucketURL: req.body.user.bitbucketURL,
      linkedinURL: req.body.user.linkedinURL,
      technologies: req.body.user.technologies,
      languages: req.body.user.languages
    }

    // Verify and create social profiles
    user = verifyAndCreateSocial(user)

    // Set current time for updated_at
    const currentLocalTime = moment();

    // Update user details
    let updatedUser = await client.query(
      `
        UPDATE users
        SET bio = $1,
            githubURL = $2,
            gitlabURL = $3,
            bitbucketURL = $4,
            linkedinURL = $5,
            updated_at = $6
        WHERE id = $7
        RETURNING id, avatar, username, email, bio, githubURL, gitlabURL, bitbucketURL, linkedinURL, created_at, updated_at;
      `,
      [user.bio, user.githubURL, user.gitlabURL, user.bitbucketURL, user.linkedinURL, currentLocalTime, id]
    )

    // Simplify updatedUser
    updatedUser = updatedUser.rows[0]

    // Replace old languages with new ones and assign it to savedUser
    await deleteUserLang(id, client)
    updatedUser.languages = await insertUserLang(user.languages, id, client)

    // Replace old technologies with new ones and assign it to savedUser
    await deleteUserTech(id, client)
    updatedUser.technologies = await insertUserTech(user.technologies, id, client)

    // If everything went well, commit the changes to the DB
    await client.query('COMMIT')

    return res.status(200).json({
      status: 200,
      message: 'User is updated',
      user: shapeUserResponse(updatedUser)
    })
  } catch (error) {
    // If something went wrong, rollback all the changes in the DB
    await client.query('ROLLBACK')
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  } finally {
    // Terminate connection
    client.release()
  }
}

exports.logout = async (req, res) => {
  // Get user ID and token
  const { id } = req.body.decoded
  const { token } = req.body

  try {
    // Delete a bearer token matching the token and the user ID
    await pool.query(
      `
        DELETE FROM bearer_tokens
        WHERE user_id = $1 AND bearer_token = $2;
      `,
      [id, token]
    )

    return res.status(200).json({
      status: 200,
      message: 'logout successful'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.logoutAll = async (req, res) => {
  // Get user ID and token
  const { id } = req.body.decoded

  try {
    // Delete a bearer token matching the token and the user ID
    await pool.query(
      `
        DELETE FROM bearer_tokens
        WHERE user_id = $1;
      `,
      [id]
    )

    return res.status(200).json({
      status: 200,
      message: 'logout from all devices was successful'
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

// Creates social profiles URLs based on usernames
const verifyAndCreateSocial = (user) => {
  if(user.githubURL !== '') {
    user.githubURL = `https://github.com/${user.githubURL}`
  }
  if(user.gitlabURL !== '') {
    user.gitlabURL = `https://gitlab.com/${user.gitlabURL}`
  }
  if(user.bitbucketURL !== '') {
    user.bitbucketURL = `https://bitbucket.org/${user.bitbucketURL}/`
  }
  if(user.linkedinURL !== '') {
    user.linkedinURL = `https://www.linkedin.com/in/${user.linkedinURL}/`
  }
  return user
}

const shapeUserResponse = (user) => {
  return {
    id: user.id,
    avatar: user.avatar,
    username: user.username,
    githubURL: user.githuburl,
    gitlabURL: user.gitlaburl,
    bitbucketURL: user.bitbucketurl,
    linkedinURL: user.linkedinurl,
    bio: user.bio,
    created_at: user.created_at,
    updated_at: user.updated_at,
    languages: user.languages,
    technologies: user.technologies
  }
}