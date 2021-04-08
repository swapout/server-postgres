const knex = require('../config/db')
const gravatar = require('gravatar')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('config')

exports.createUser = async (req, res) => {
  try {
    let user = req.body.user

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
    await knex('user').insert({
      avatar: user.avatar,
      username: user.username,
      email: user.email,
      password: user.password,
      githubURL: user.githubURL,
      gitlabURL: user.gitlabURL,
      bitbucketURL: user.bitbucketURL,
      linkedinURL: user.linkedinURL,
      bio: user.bio
    });

    // Retrieves newly created user from user table
    const savedUser = await knex.select(
      'user_id',
      'avatar',
      'username',
      'email',
      'githubURL',
      'gitlabURL',
      'bitbucketURL',
      'linkedinURL',
      'bio',
      'created_at'
    ).from('user').where({email: user.email})

    // Creates and signs the bearer token
    const token = jwt.sign(
      { user_id: savedUser[0].user_id, username: user.username, email: user.username },
      config.get('bearerTokenSecret')
    )

    // Inserts token into bearer_token table
    await knex('bearer_token').insert({
      bearer_token: token,
      user_id: savedUser[0].user_id
    })

    // Gets technologies corresponding of the array of user technologies
    const techDetails = await knex.select('value', 'label').from('technology').where((builder) => {
      builder.whereIn('label', user.technologies)
    })

    // Assigns technology array to user technologies for the response
    savedUser[0].technologies = techDetails

    // Prepares array for user_technology_relation table
    const userTechArray = []

    techDetails.map((tech) => {
      return userTechArray.push({
        user_id: savedUser[0].user_id,
        technology_id: tech.technology_id
      })
    })

    // Inserts user_technology_relation to table
    await knex.batchInsert('user_technology_relation', userTechArray)

    // Gets languages corresponding of the array of user languages
    const langDetails = await knex.select('label', 'value').from('language').where((builder) => {
      builder.whereIn('label', user.languages)
    })

    // Assigns language array to user languages for the response
    savedUser[0].languages = langDetails

    // Prepares array for user_language_relation table
    const userLangArray = []

    langDetails.map((lang) => {
      return userLangArray.push({
        user_id: savedUser[0].user_id,
        language_id: lang.language_id
      })
    })

    // Inserts user_language_relation to table
    await knex.batchInsert('user_language_relation', userLangArray)

    // Success response including the user and token
    return res.status(201).json({
      status: 201,
      message: 'User created',
      user: savedUser[0],
      token
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