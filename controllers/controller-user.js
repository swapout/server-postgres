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

    const savedUser = await knex('user').insert(user)
    console.log(savedUser)
    res.send('create user route')
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