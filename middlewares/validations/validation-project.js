const { pool } = require('../../config/db')

exports.createProjectValidation = async (req, res, next) => {
  const { project } = req.body
  // List of validation errors on project creation
  const validationErrors = {
    invalidUserId: false,
    nameFieldMissing: false,
    nameRequired: false,
    nameShort: false,
    nameLong: false,
    descriptionFieldMissing: false,
    descriptionRequired: false,
    descriptionShort: false,
    descriptionLong: false,
    technologiesFieldMissing: false,
    projectURLFieldMissing: false,
    projectURLShort: false,
    projectURLLong: false,
  }

  try {
    // Check if user ID is in the users table
    const isUser = await pool.query(
      `
        select exists(select 1 from users where id = $1) AS "exists"
      `,
      [req.body.decoded.id]
    )

    // Add user exists to the error object depending on the result of the SQL query
    validationErrors.invalidUserId = !isUser.rows[0].exists

    // Check if key, name exists on project
    if(project.hasOwnProperty("name")) {

      // Check if name field is not empty
      if(!project.name) {
        validationErrors.nameRequired = true
      } else {
        // Check if name is to short
        validationErrors.nameShort = !(project.name.length >= 3)

        // Check if name is too long
        validationErrors.nameLong = !(project.name.length <= 255)
      }

    } else {
      // If field doesn't exists on req.body
      validationErrors.nameFieldMissing = true
    }

    // Check if key, description exists on project
    if(project.hasOwnProperty("description")) {

      // Check if description field is not empty
      if(!project.description) {
        validationErrors.descriptionRequired = true
      } else {
        // Check if description is to short
        validationErrors.descriptionShort = !(project.description.length >= 10)

        // Check if description is too long
        validationErrors.descriptionLong = !(project.description.length <= 65535)
      }

    } else {
      // If field doesn't exists on req.body
      validationErrors.descriptionFieldMissing = true
    }

    // Check if technologies key exists on project
    validationErrors.technologiesFieldMissing = !project.hasOwnProperty("technologies")

    // Check if key, projectURL exists on project
    if(project.hasOwnProperty("projectURL")) {
      // Check if projectURL field is not empty
      if(project.projectURL) {
        // Check if projectURL is to short
        validationErrors.projectURLShort = !(project.projectURL.length >= 4)

        // Check if projectURL is too long
        validationErrors.projectURLLong = !(project.projectURL.length <= 255)
      }
    } else {
      validationErrors.projectURLFieldMissing = true
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