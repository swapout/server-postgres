const { validator } = require("../../helpers/validators");
const { projectConstrains } = require("../../data/validation-constrains");

exports.createProjectValidation = async (req, res, next) => {
  try {
    // Get project data from the request body
    const { project } = req.body;

    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = [
      "name",
      "description",
      "mission",
      "technologies",
      "projectURL",
    ];

    // Check if all required fields are present and add missing ones to missing fields variable
    missingFields = validator.validateRequiredFields(requiredFields, project);

    // If there are no missing fields on req.body
    if (missingFields.length === 0) {
      // Add and validate each field
      validationErrors = {
        // Check if project name is too short
        nameShort: validator.validateTooShort(
          project.name,
          projectConstrains.name.minLength
        ),
        // Check if project name is too long
        nameLong: validator.validateTooLong(
          project.name,
          projectConstrains.name.maxLength
        ),
        // Check if project description is too short
        descriptionShort: validator.validateTooShort(
          project.description,
          projectConstrains.description.minlength
        ),
        // Check if project description is too long
        descriptionLong: validator.validateTooLong(
          project.description,
          projectConstrains.description.maxLength
        ),
        // Check if project mission is too short
        missionShort: validator.validateTooShort(
          project.mission,
          projectConstrains.mission.minLength
        ),
        // Check if project mission is too long
        missionLong: validator.validateTooLong(
          project.mission,
          projectConstrains.mission.maxLength
        ),
        // Check if project technologies is too short
        technologiesRequired: validator.validateTooShort(
          project.technologies,
          projectConstrains.technologies.minLength
        ),
        // Check if project URL is a valid url pattern
        invalidProjectURL: validator.validatePattern(
          project.projectURL,
          projectConstrains.projectURL.pattern
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
