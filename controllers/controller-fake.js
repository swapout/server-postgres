const { pool } = require('../config/db')
const format = require('pg-format')

const bcrypt = require('bcryptjs')
const faker = require('faker')

const {
  insertUserTech,
  insertUserLang,
  insertProjectTech,
  insertPositionTech,
  fetchPositionTech,
  fetchUserTech,
  fetchUserLang,
  deleteUserLang,
  deleteUserTech,
  deletePositionTech
} = require('../helpers/helper-queries')
const { createAndSaveBearerToken } = require('../helpers/helper-tokens')

exports.fakeUser = async (req, res) => {
  let numberOfFakeUsers = req.body.fake
  const hash = req.body.hash
  const bearer = req.body.bearer
  const bio = req.body.bio
  const minDate = req.body.minDate
  const maxDate = req.body.maxDate
  const maxTech = req.body.maxTech
  const maxLang = req.body.maxLang
  const githubURL = req.body.githubURL
  const gitlabURL = req.body.gitlabURL
  const bitbucketURL = req.body.bitbucketURL
  const linkedinURL = req.body.linkedinURL
  let users = []

  try {
    while(numberOfFakeUsers > 0) {
      const username = `${faker.internet.userName()}${faker.datatype.number()}`
      const lowerCaseUsername = username.toLowerCase()
      const randomDate = faker.date.between(minDate, maxDate)
      let user = {
        avatar: faker.internet.avatar(),
        username: username,
        email: `${lowerCaseUsername}@${faker.internet.domainName()}`,
        password: '12345678a',
        githubURL: githubURL ? `https://github.com/${lowerCaseUsername}` : '',
        gitlabURL: gitlabURL ? `https://gitlab.com/${lowerCaseUsername}` : '',
        bitbucketURL: bitbucketURL ? `https://bitbucket.org/${lowerCaseUsername}/` : '',
        linkedinURL: linkedinURL ? `https://www.linkedin.com/in/${lowerCaseUsername}/` : '',
        bio: bio ? faker.lorem.paragraph() : '',
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

      const technologies = await getTableSample('technologies', maxTech)
      const languages = await getTableSample('languages', maxLang)

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

exports.fakeProject = async (req, res) => {
  let numberOfFakeProjects = req.body.fake
  const maxTech = req.body.maxTech
  const minDate = req.body.minDate
  const maxDate = req.body.maxDate
  const numberOfWordsInName= req.body.numberOfWordsInName
  const numberOfWordsInDescription = req.body.numberOfWordsInDescription
  let projects = []

  try {
    while(numberOfFakeProjects > 0) {
      const randomDate = faker.date.between(minDate, maxDate)
      const randomUser = await getRandomUser()
      const userId = randomUser.rows[0].id
      let project = {
        name: faker.random.words(numberOfWordsInName),
        description: faker.lorem.words(numberOfWordsInDescription),
        projectURL: faker.internet.url(),
        created_at: randomDate,
        updated_at: randomDate,
        owner: userId
      }

      // Save project into DB
      let savedProject = await pool.query(
        `
        INSERT INTO projects (name, description, projectURL, owner, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `,
        [project.name, project.description, project.projectURL, userId, project.created_at, project.updated_at]
      )
      const technologies = await getTableSample('technologies', maxTech)
      savedProject.rows[0].technologies = await insertProjectTech(getLabelArray(technologies.rows), savedProject.rows[0].id, pool)
      projects.push(savedProject.rows[0])
      numberOfFakeProjects--
    }

    return res.status(201).json({
      status: 201,
      message: `${projects.length} projects created`,
      projects
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.fakePosition = async (req, res) => {
  let numberOfFakePositions = req.body.fake
  const maxTech = req.body.maxTech
  const minDate = req.body.minDate
  const maxDate = req.body.maxDate
  const minNumPos = req.body.minNumPos
  const maxNumPos = req.body.maxNumPos
  const numberOfWordsInTitle= req.body.numberOfWordsInTitle
  const numberOfWordsInDescription = req.body.numberOfWordsInDescription
  let positions = []
  try {
    while(numberOfFakePositions > 0) {
      const randomDate = faker.date.between(minDate, maxDate)
      const randomProject = await getRandomProject()
      const projectId = randomProject.rows[0].id
      const projectOwner = randomProject.rows[0].owner

      let position = {
        title: faker.random.words(numberOfWordsInTitle),
        description: faker.lorem.words(numberOfWordsInDescription),
        numberOfPositions: faker.datatype.number({min: minNumPos, max: maxNumPos, precision: 1}),
        projectId: projectId,
        userId: projectOwner,
        createdAt: randomDate,
        updatedAt: randomDate
      }

      const savedPosition = await pool.query(
        `
          INSERT INTO positions (title, description, number_of_positions, project_id, user_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `,
        [position.title, position.description, position.numberOfPositions, position.projectId, position.userId, position.createdAt, position.updatedAt]
      )
      console.log(savedPosition.rows[0])
      const technologies = await getTableSample('technologies', maxTech)
      savedPosition.rows[0].technologies = await insertPositionTech(getLabelArray(technologies.rows), savedPosition.rows[0].id, pool)
      positions.push(savedPosition.rows[0])
      numberOfFakePositions--
    }

    return res.status(201).json({
      status: 201,
      message: `${positions.length} projects created`,
      positions
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

/////////////
// HELPERS //
/////////////

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

const getRandomUser = async () => {
  return pool.query(    `
      SELECT id 
      FROM users 
      ORDER BY random() 
      LIMIT random() * 1 + 1;
    `)
}

const getRandomProject = async () => {
  return pool.query(    `
      SELECT id, owner
      FROM projects 
      ORDER BY random() 
      LIMIT random() * 1 + 1;
    `)
}