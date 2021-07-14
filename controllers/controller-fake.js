const { pool } = require("../config/db");
const format = require("pg-format");
const moment = require("moment");

const bcrypt = require("bcryptjs");
const faker = require("faker");

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
  deletePositionTech,
} = require("../helpers/helper-queries");
const { createAndSaveBearerToken } = require("../helpers/helper-tokens");

exports.fakeUser = async (req, res) => {
  let numberOfFakeUsers = req.body.fake || 1;
  const hash = req.body.hash || true;
  const bearer = req.body.bearer || true;
  const bio = req.body.bio || true;
  const minDate = req.body.minDate || "2015-12-31";
  const maxDate = req.body.maxDate || "2021-05-01";
  const maxTech = req.body.maxTech || 7;
  const maxLang = req.body.maxLang || 4;
  const githubURL = req.body.githubURL || true;
  const gitlabURL = req.body.gitlabURL || true;
  const bitbucketURL = req.body.bitbucketURL || true;
  const linkedinURL = req.body.linkedinURL || true;
  let users = [];

  try {
    while (numberOfFakeUsers > 0) {
      const username = `${faker.internet.userName()}${faker.datatype.number()}`;
      const lowerCaseUsername = username.toLowerCase();
      const randomDate = faker.date.between(minDate, maxDate);
      let user = {
        avatar: faker.internet.avatar(),
        username: username,
        email: `${lowerCaseUsername}@${faker.internet.domainName()}`,
        password: "12345678a",
        githubURL: githubURL ? `https://github.com/${lowerCaseUsername}` : "",
        gitlabURL: gitlabURL ? `https://gitlab.com/${lowerCaseUsername}` : "",
        bitbucketURL: bitbucketURL
          ? `https://bitbucket.org/${lowerCaseUsername}/`
          : "",
        linkedinURL: linkedinURL
          ? `https://www.linkedin.com/in/${lowerCaseUsername}/`
          : "",
        bio: bio ? faker.lorem.paragraph() : "",
        created_at: randomDate,
        updated_at: randomDate,
      };

      if (hash) {
        user.password = await bcrypt.hash(user.password, 1);
      }

      let createdUser = await pool.query(
        `
        INSERT INTO users (avatar, username, email, password, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id, avatar, username, email, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at;
        `,
        [
          user.avatar,
          user.username,
          user.email,
          user.password,
          user.githubURL,
          user.gitlabURL,
          user.bitbucketURL,
          user.linkedinURL,
          user.bio,
          user.created_at,
          user.updated_at,
        ]
      );

      createdUser = createdUser.rows[0];

      const technologies = await getTableSample("technologies", maxTech);
      const languages = await getTableSample("languages", maxLang);

      if (bearer) {
        // Create and save bearer_token to DB
        await createAndSaveBearerToken(createdUser, res, pool);
      }

      // Insert technologies and languages to DB and receive the formatted arrays back
      createdUser.technologies = await insertUserTech(
        getIdArray(technologies.rows),
        createdUser.id,
        pool
      );
      createdUser.lanugaues = await insertUserLang(
        getIdArray(languages.rows),
        createdUser.id,
        pool
      );

      users.push(createdUser);
      numberOfFakeUsers--;
    }

    return res.status(201).json({
      status: 201,
      message: `${users.length} users created`,
      users,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

exports.fakeProject = async (req, res) => {
  let numberOfFakeProjects = req.body.fake;
  const maxTech = req.body.maxTech;
  const maxDate = req.body.maxDate;
  const numberOfWordsInName = req.body.numberOfWordsInName;
  const numberOfWordsInDescription = req.body.numberOfWordsInDescription;
  const numberOfWordsInMission = req.body.numberOfWordsInMission;
  let projects = [];

  try {
    while (numberOfFakeProjects > 0) {
      const randomUser = await getRandomUser();
      const userId = randomUser.rows[0].id;
      const randomDate = faker.date.between(
        moment(randomUser.rows[0].created_at),
        maxDate
      );
      let project = {
        name: faker.random.words(numberOfWordsInName),
        description: faker.lorem.words(numberOfWordsInDescription),
        mission: faker.lorem.words(numberOfWordsInMission),
        projectURL: faker.internet.url(),
        created_at: randomDate,
        updated_at: randomDate,
        owner: userId,
      };

      // Save project into DB
      let savedProject = await pool.query(
        `
        INSERT INTO projects (name, description, mission, projectURL, owner, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `,
        [
          project.name,
          project.description,
          project.mission,
          project.projectURL,
          userId,
          project.created_at,
          project.updated_at,
        ]
      );
      const technologies = await getTableSample("technologies", maxTech);
      savedProject.rows[0].technologies = await insertProjectTech(
        getIdArray(technologies.rows),
        savedProject.rows[0].id,
        pool
      );
      projects.push(savedProject.rows[0]);
      numberOfFakeProjects--;
    }

    return res.status(201).json({
      status: 201,
      message: `${projects.length} projects created`,
      projects,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

exports.fakePosition = async (req, res) => {
  let numberOfFakePositions = req.body.fake;
  const maxDate = req.body.maxDate;
  const minNumPos = req.body.minNumPos;
  const maxNumPos = req.body.maxNumPos;
  const numberOfWordsInTitle = req.body.numberOfWordsInTitle;
  const numberOfWordsInQualifications = req.body.numberOfWordsInQualifications;
  const numberOfWordsInDuties = req.body.numberOfWordsInDuties;

  let positions = [];
  try {
    while (numberOfFakePositions > 0) {
      const role = await getTableSample("roles", 1);
      const level = faker.random.arrayElement([1, 2, 3, 4]);
      const randomProject = await getRandomProject();
      const projectId = randomProject.rows[0].id;
      const projectOwner = randomProject.rows[0].owner;
      const randomDate = faker.date.between(
        moment(randomProject.rows[0].created_at),
        maxDate
      );

      let position = {
        title: faker.random.words(numberOfWordsInTitle),
        qualifications: faker.lorem.words(numberOfWordsInQualifications),
        duties: faker.lorem.words(numberOfWordsInDuties),
        vacancies: faker.datatype.number({
          min: minNumPos,
          max: maxNumPos,
          precision: 1,
        }),
        projectId: projectId,
        userId: projectOwner,
        role: role,
        level: level,
        createdAt: randomDate,
        updatedAt: randomDate,
      };

      const savedPosition = await pool.query(
        `
          INSERT INTO positions (title, qualifications, duties, vacancies, project_id, user_id, created_at, updated_at, role, level)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `,
        [
          position.title,
          position.qualifications,
          position.duties,
          position.vacancies,
          position.projectId,
          position.userId,
          position.createdAt,
          position.updatedAt,
          position.role.rows[0].id,
          position.level,
        ]
      );

      await pool.query(
        `
        UPDATE projects
        SET hasPositions = true
        WHERE id = $1
        RETURNING *;
      `,
        [projectId]
      );

      const technologies = await pool.query(
        `
          SELECT array_agg(technology_id) AS tech
          FROM projects_technologies_relations ptr
          WHERE project_id = $1
          GROUP BY project_id;
        `,
        [projectId]
      );
      // Get a random number and order of array elements from an array
      const randomArray = getLimitedNumberOfRandomValuesFromArray(
        technologies.rows[0].tech,
        getNonZeroArrayLength(technologies.rows[0].tech)
      );
      // Save technologies for position
      savedPosition.rows[0].technologies = await insertPositionTech(
        randomArray,
        savedPosition.rows[0].id,
        pool
      );
      positions.push(savedPosition.rows[0]);
      numberOfFakePositions--;
    }

    return res.status(201).json({
      status: 201,
      message: `${positions.length} positions created`,
      positions,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

exports.fakeApplication = async (req, res) => {
  let numberOfFakeApplications = req.body.fake;
  const maxDate = req.body.maxDate;
  let applications = [];
  try {
    while (numberOfFakeApplications > 0) {
      const randomPosition = await getRandomPosition();
      const positionId = randomPosition.rows[0].id;
      const projectOwner = randomPosition.rows[0].user_id;
      const randomDate = faker.date.between(
        moment(randomPosition.rows[0].created_at),
        maxDate
      );
      const randomUser = await getRandomUser();

      if (randomUser.rows[0].id !== projectOwner) {
        const isExistingApplication = await pool.query(
          `
          select *
          from positions_applications_relations
          where user_id = $1 and position_id = $2;
        `,
          [randomUser.rows[0].id, positionId]
        );

        if (isExistingApplication.rows.length === 0) {
          const savedApplication = await pool.query(
            `
              INSERT INTO positions_applications_relations (user_id, position_id, created_at, updated_at)
              VALUES ($1, $2, $3, $4)
              RETURNING *;
            `,
            [randomUser.rows[0].id, positionId, randomDate, randomDate]
          );

          applications.push(savedApplication.rows[0]);
          numberOfFakeApplications--;
        }
      }
    }

    return res.status(201).json({
      status: 201,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

/////////////
// HELPERS //
/////////////

const getTableSample = async (tableName, maxSamples) => {
  let sql = format(
    `
      SELECT id, label
      FROM %1$I 
      ORDER BY random() 
      LIMIT random() * %2$L + 1;
    `,
    tableName,
    maxSamples
  );

  return pool.query(sql);
};

const getIdArray = (arr) => {
  return arr.map((el) => {
    return el.id;
  });
};

const getRandomUser = async () => {
  return pool.query(`
      SELECT id 
      FROM users 
      ORDER BY random() 
      LIMIT random() * 1 + 1;
    `);
};

const getRandomProject = async () => {
  return pool.query(`
      SELECT id, owner
      FROM projects 
      ORDER BY random() 
      LIMIT random() * 1 + 1;
    `);
};

const getRandomPosition = async () => {
  return pool.query(`
      SELECT id, user_id, project_id
      FROM positions 
      ORDER BY random() 
      LIMIT random() * 1 + 1;
    `);
};

// Get random elements from an array
const getLimitedNumberOfRandomValuesFromArray = (arr, n) => {
  let result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    const x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};

// Get a non-zero array length
const getNonZeroArrayLength = (arr) => {
  const length = Math.floor(Math.random() * arr.length);
  if (length > 0) {
    return length;
  } else {
    return getNonZeroArrayLength(arr);
  }
};
