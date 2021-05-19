const { pool } = require('../../config/db')
const format = require('pg-format')

exports.createPositionValidation = async (req, res, next) => {
  // Get user ID from decoded token
  const userId = req.body.decoded.id
  // Get position details from the request
  const { position } = req.body

  // List of validation errors on position creation
  const validationErrors = {
    invalidUserId: false,
    titleFieldMissing: false,
    titleRequired: false,
    titleShort: false,
    titleLong: false,
    descriptionFieldMissing: false,
    descriptionRequired: false,
    descriptionShort: false,
    descriptionLong: false,
    projectIdFieldMissing: false,
    invalidProjectId: false,
    notProjectOwner: false,
    levelFieldMissing: false,
    invalidLevel: false,
    roleFieldMissing: false,
    invalidRole: false,
    technologiesFieldMissing: false,
    technologiesNotInProject: false,
    vacanciesFieldMissing: false,
    vacanciesIsTooSmall: false,
    vacanciesIsTooBig: false,
  }

  try {
    // Check if user ID is in the users table
    const isUser = await pool.query(
      `
        select exists(select 1 from users where id = $1) AS "exists"
      `,
      [userId]
    )

    // Add user exists to the error object depending on the result of the SQL query
    validationErrors.invalidUserId = !isUser.rows[0].exists

    // Check if key, title exists on position
    if(position.hasOwnProperty("title")) {

      // Check if title field is not empty
      if(!position.title) {
        validationErrors.titleRequired = true
      } else {
        // Check if title is to short
        validationErrors.titleShort = !(position.title.length >= 3)

        // Check if title is too long
        validationErrors.titleLong = !(position.title.length <= 255)
      }
    } else {
      // If field doesn't exists on req.body
      validationErrors.titleFieldMissing = true
    }

    // Check if key, description exists on position
    if(position.hasOwnProperty("description")) {
      // Check if description field is not empty
      if(!position.description) {
        validationErrors.descriptionRequired = true
      } else {
        // Check if description is to short
        validationErrors.descriptionShort = !(position.description.length >= 10)

        // Check if description is too long
        validationErrors.descriptionLong = !(position.description.length <= 65535)
      }
    } else {
      // If field doesn't exists on req.body
      validationErrors.descriptionFieldMissing = true
    }

    // Check if key, projectId exists on position
    if(position.hasOwnProperty("projectId")) {
      // Check if project ID is in the projects table
      const isValidProjectId = await pool.query(
       `
        select exists(select 1 from projects where id = $1) AS "exists"
      `,
       [position.projectId]
     )
      // If project ID is not in projects table
      if(!isValidProjectId.rows[0].exists) {
        // Add project exists to the error object depending on the result of the SQL query
        validationErrors.invalidProjectId = true
      } else {
        // Verify if decoded user is the actual project owner
        const isProjectOwner = await pool.query(
          `
        SELECT owner
        FROM projects
        WHERE owner = $1 and id = $2
        LIMIT 1
      `,
          [userId, position.projectId]
        )
        // If the user is not the project owner
        validationErrors.notProjectOwner = isProjectOwner.rows.length < 1
      }
    } else {
      // If field doesn't exists on req.body
      validationErrors.projectIdFieldMissing = true
    }

    // Check if key, level exists on position
    if(position.hasOwnProperty("level")) {
      // Check if level ID is in the levels table
      const isLevel = await pool.query(
        `
        select exists(select 1 from levels where id = $1) AS "exists"
      `,
        [position.level]
      )
      // If level is not in levels table
      validationErrors.invalidLevel = !isLevel.rows[0].exists
    } else {
      // If key, level doesn't exists on position
      validationErrors.levelFieldMissing = true
    }

    // Check if key, role exists on position
    if(position.hasOwnProperty("role")) {
      // Check if role ID is in the roles table
      const isRole = await pool.query(
        `
        select exists(select 1 from roles where id = $1) AS "exists"
      `,
        [position.role]
      )
      // If role is not in roles table
      validationErrors.invalidRole = !isRole.rows[0].exists
    } else {
      // If key, role doesn't exists on position
      validationErrors.roleFieldMissing = true
    }

    // Check if key, technologies exists on position
    if(position.hasOwnProperty("technologies")) {
      // Check if technologies are in project technologies
      const sql = format(
        `
        select *
        from projects p
        join (
            select array_agg(technology_id)::text[] as tech, project_id
            from projects_technologies_relations
            group by project_id
        ) as ptr on ptr.project_id = p.id
        where ptr.tech @> array[%1$L] and p.id = %2$L;
      `,
        position.technologies, position.projectId
      )
      // Send formed query
      const isProjectIncludesTech = await pool.query(sql)

      // If technologies are not included in the project
      validationErrors.technologiesNotInProject = !isProjectIncludesTech.rows.length
    } else {
      // If key, technologies doesn't exists on position
      validationErrors.technologiesFieldMissing = true
    }

    // Check if key, vacancies exists on position
    if(position.hasOwnProperty("vacancies")) {
      //If vacancies value is too small
      validationErrors.vacanciesIsTooSmall = position.vacancies <= 0

      //If vacancies value is too big
      validationErrors.vacanciesIsTooBig = position.vacancies > 100
    } else {
      // If key, vacancies doesn't exists on position
      validationErrors.vacanciesFieldMissing = true
    }

    // Loop through the validation error object and see if any of them is true
    if(Object.values(validationErrors).includes(true)) {
      return res.status(400).json({
        status: 400,
        message: 'Validation errors',
        validationErrors
      })
    }

    next()
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}