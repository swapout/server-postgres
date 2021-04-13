const { pool } = require('../config/db')
const gravatar = require('gravatar')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('config')
const format = require('pg-format');

exports.createUser = async (req, res) => {

  const client = await pool.connect()
  await client.query('BEGIN')
  try {
    let user = req.body.user

    // Delete confirm password
    delete user.confirmPassword

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
        RETURNING *;
        `,
      [user.avatar, user.username, user.email, user.password, user.githubURL, user.gitlabURL, user.bitbucketURL, user.linkedinURL, user.bio])

    const savedUser = response.rows[0]

    // Creates and signs the bearer token
    const token = jwt.sign(
      { user_id: savedUser.id, username: user.username, email: user.username },
      config.get('bearerTokenSecret')
    )

    // Inserts token into bearer_token table
    await client.query(
      `
        INSERT INTO bearer_tokens (bearer_token, user_id)
        VALUES ($1, $2)
        `,
      [token, savedUser.id]
    )

    // Gets technologies corresponding of the array of user technologies
    const technologies = await client.query(
      `
        SELECT id, label, value, status 
        FROM technologies 
        WHERE label = ANY ($1);
      `,
      [user.technologies]
    )

    // Assigns technology array to user technologies for the response
    const techIdArray = []
    technologies.rows.map((tech) => {
      techIdArray.push([savedUser.id, tech.id])
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

    // Gets languages corresponding of the array of user languages
    const languages = await client.query(
      `
        SELECT id, label, value 
        FROM languages 
        WHERE label = ANY ($1);
      `,
      [user.languages]
    )

    // Assigns language array to user languages for the response
    const langIdArray = []
    languages.rows.map((lang) => {
      langIdArray.push([savedUser.id, lang.id])
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

    // Add technologies and languages to user
    savedUser.technologies = technologies.rows
    savedUser.languages = languages.rows

    await client.query('COMMIT')
    // Success response including the user and token
    return res.status(201).json({
      status: 201,
      message: 'User created',
      token,
      user: savedUser
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
    const user = {
      email: req.body.user.email,
      password: req.body.user.password
    }

    const foundUser = await knex.select(
      'user.user_id',
      'user.avatar',
      'user.username',
      'user.password',
      'user.email',
      'user.githubURL',
      'user.gitlabURL',
      'user.bitbucketURL',
      'user.linkedinURL',
      'user.bio',
    )
      .from('user')
      .where('email', user.email)
      .limit(1)

    if(foundUser.length === 0) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials'
      })
    }

    const isPasswordsMatch = await bcrypt.compare(user.password, foundUser[0].password)

    if(!isPasswordsMatch) {
      if(foundUser.length === 0) {
        return res.status(401).json({
          status: 401,
          message: 'Invalid credentials'
        })
      }
    }
    delete foundUser[0].password

    const lang = await knex
      .select('label')
      .from('user_language_relation')
      .where('user_id', foundUser[0].user_id)

    if (lang.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Something went wrong'
      })
    }

    foundUser[0].languages = []

    lang.map((lang) => {
      foundUser[0].languages.push({
        label: lang.label,
        value: lang.label.toLowerCase()
      })
    })

    const tech = await knex
      .select('label')
      .from('user_technology_relation')
      .where('user_id', foundUser[0].user_id)

    if (tech.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Something went wrong'
      })
    }

    foundUser[0].technologies = []

    tech.map((tech) => {
      foundUser[0].technologies.push({
        label: tech.label,
        value: tech.label.toLowerCase()
      })
    })

    // Creates and signs the bearer token
    const token = jwt.sign(
      { user_id: foundUser[0].user_id, username: foundUser[0].username, email: foundUser[0].username },
      config.get('bearerTokenSecret')
    )

    // Inserts token into bearer_token table
    const insertedToken = await knex('bearer_token').insert({
      bearer_token: token,
      user_id: foundUser[0].user_id
    })

    if (insertedToken.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Something went wrong'
      })
    }

    // Success response including the user and token
    return res.status(200).json({
      status: 200,
      message: 'Login success',
      user: foundUser[0],
      token
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