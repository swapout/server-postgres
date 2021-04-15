const { pool } = require('../config/db')
const format = require('pg-format');

const bcrypt = require('bcryptjs')
const faker = require('faker')

const {
  insertUserTech,
  insertUserLang,
  fetchUserTech,
  fetchUserLang,
  deleteUserLang,
  deleteUserTech
} = require('../helpers/helper-queries')
const { createAndSaveBearerToken } = require('../helpers/helper-tokens')

exports.fakeUser = async (req, res) => {
  let numberOfFakeUsers = req.body.fake
  const hash = req.body.hash
  const bearer = req.body.bearer
  let users = []

  try {
    while(numberOfFakeUsers > 0) {
      const username = `${faker.internet.userName()}${faker.datatype.number()}`
      const lowerCaseUsername = username.toLowerCase()
      const randomDate = faker.date.between('2015-01-01', '2021-04-15')
      let user = {
        avatar: faker.internet.avatar(),
        username: username,
        email: `${lowerCaseUsername}@${faker.internet.domainName()}`,
        password: '12345678a',
        githubURL: `https://github.com/${lowerCaseUsername}`,
        gitlabURL: `https://gitlab.com/${lowerCaseUsername}`,
        bitbucketURL: `https://bitbucket.org/${lowerCaseUsername}/`,
        linkedinURL: `https://www.linkedin.com/in/${lowerCaseUsername}/`,
        bio: faker.lorem.paragraph(),
        created_at: randomDate,
        updated_at: randomDate
      }

      if(hash) {
        user.password = await bcrypt.hash(user.password, 1)
      }

      let createdUser = await pool.query(
        `
        INSERT INTO users (avatar, username, email, password, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id, avatar, username, email, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at;
        `,
        [user.avatar, user.username, user.email, user.password, user.githubURL, user.gitlabURL, user.bitbucketURL, user.linkedinURL, user.bio, user.created_at, user.updated_at]
      )

      createdUser = createdUser.rows[0]

      const technologies = await getTableSample('technologies', 7)
      const languages = await getTableSample('languages', 4)

      if(bearer) {
        // Create and save bearer_token to DB
        await createAndSaveBearerToken(createdUser, res, pool)
      }

      // Insert technologies and languages to DB and receive the formatted arrays back
      createdUser.technologies = await insertUserTech(getLabelArray(technologies.rows), createdUser.id, pool)
      createdUser.lanugaues = await insertUserLang(getLabelArray(languages.rows), createdUser.id, pool)

      users.push(createdUser)
      numberOfFakeUsers--;
    }

    return res.status(201).json({
      status: 201,
      message: `${users.length} users created`,
      users
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

const getTableSample = async (tableName, maxSamples) => {
  let sql = format(
    `
      SELECT id, label, value 
      FROM %1$I 
      ORDER BY random() 
      LIMIT random() * %2$L + 1;
    `,
    tableName, maxSamples
  )

  return pool.query(sql)
}

const getLabelArray = (arr) => {
  return arr.map((el) => {
    return el.label
  })
}