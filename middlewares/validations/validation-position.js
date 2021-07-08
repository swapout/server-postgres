const { validator } = require("../../helpers/validators");
const { positionConstrains } = require("../../data/validation-constrains");

exports.positionValidation = async (req, res, next) => {
  try {
    // Get user ID from decoded token
    const userId = req.body.decoded.id;
    // Get position details from the request
    const { position } = req.body;

    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = [
      "projectId",
      "title",
      "description",
      "qualifications",
      "duties",
      "level",
      "role",
      "technologies",
      "vacancies",
    ];

    // Check if all required fields are present and add missing ones to missing fields variable
    missingFields = validator.validateRequiredFields(requiredFields, position);

    // If there are no missing fields on req.body
    if (missingFields.length === 0) {
      // List of validation errors on position creation
      validationErrors = {
        invalidUserId: !(await validator.validateIsExistsAsync(
          "users",
          "id",
          userId
        )),
        titleShort: validator.validateTooShort(
          position.title,
          positionConstrains.title.minLength
        ),
        titleLong: validator.validateTooLong(
          position.title,
          positionConstrains.title.maxLength
        ),
        descriptionShort: validator.validateTooShort(
          position.description,
          positionConstrains.description.minLength
        ),
        descriptionLong: validator.validateTooLong(
          position.description,
          positionConstrains.description.maxLength
        ),
        qualificationsLong: validator.validateTooLong(
          position.qualifications,
          positionConstrains.qualifications.maxLength
        ),
        dutiesLong: validator.validateTooLong(
          position.duties,
          positionConstrains.duties.maxLength
        ),
        invalidProjectId: !(await validator.validateIsExistsAsync(
          "projects",
          "id",
          position.projectId
        )),
        invalidProjectOwner: await validator.validateIsProjectOwner(
          userId,
          position.projectId
        ),
        invalidLevel: !(await validator.validateIsExistsAsync(
          "levels",
          "id",
          position.level
        )),
        invalidRole: !(await validator.validateIsExistsAsync(
          "roles",
          "id",
          position.role
        )),
        technologiesNotInProject:
          !(await validator.validateProjectIncludesTechnologies(
            position.technologies,
            position.projectId
          )),
        vacanciesIsTooSmall: validator.validateValueTooSmall(
          position.vacancies,
          positionConstrains.vacancies.minLimit
        ),
        vacanciesIsTooBig: validator.validateValueTooBig(
          position.vacancies,
          positionConstrains.vacancies.maxLimit
        ),
      };
    }

    // Loop through the validation error object and see if any of them is true
    // or if there are no missing fields
    if (
      Object.values(validationErrors).includes(true) ||
      missingFields.length > 0
    ) {
      return res.status(400).json({
        status: 400,
        message: "Validation errors",
        validationErrors,
        missingFields,
      });
    }

    next();
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};
