const knex = require('../config/db')
const gravatar = require('gravatar')

exports.createUser = async (req, res) => {
  try {
    let user = req.body.user
    delete user.confirmPassword

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
    })

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

    const techDetails = await knex.select('technology_id').from('technology').where((builder) => {
      builder.whereIn('name', user.technologies)
    })

    const userTechArray = []

    techDetails.map((tech) => {
      return userTechArray.push({
        user_id: savedUser[0].user_id,
        technology_id: tech.technology_id
      })
    })
    knex.batchInsert('user_technology_relation', userTechArray)
      .then(function() {
        console.log('all went well')})
      .catch(function(error) {
        console.log(error.message)
      });

    const langDetails = await knex.select('language_id').from('language').where((builder) => {
      builder.whereIn('name', user.languages)
    })

    console.log(langDetails)
    const userLangArray = []

    langDetails.map((lang) => {
      return userLangArray.push({
        user_id: savedUser[0].user_id,
        language_id: lang.language_id
      })
    })
    knex.batchInsert('user_language_relation', userLangArray)
      .then(function() {
        console.log('all went well')})
      .catch(function(error) {
        console.log(error.message)
      });
    console.log(userTechArray)
    console.log(userLangArray)
    res.send(...savedUser)
  } catch (error) {
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