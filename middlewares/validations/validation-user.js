const { validator } = require("../../helpers/validators");
const { userConstrains } = require("../../data/validation-constrains");

exports.registerUserValidation = async (req, res, next) => {
  try {
    // Get user data from request body
    const { user } = req.body;
    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = [
      "email",
      "username",
      "password",
      "confirmPassword",
      "githubURL",
      "gitlabURL",
      "bitbucketURL",
      "linkedinURL",
      "technologies",
      "languages",
      "bio",
    ];

    // Check if all required fields are present and add missing ones to missing fields variable
    missingFields = validator.validateRequiredFields(requiredFields, user);

    // If there are no missing fields on req.body
    if (missingFields.length === 0) {
      // Add and validate each field
      validationErrors = {
        // Check email, if it's a valid email format
        invalidEmail: validator.validatePattern(
          user.email,
          userConstrains.email.pattern
        ),
        // Check if email is not already in use
        emailInUse: await validator.validateIsExistsAsync(
          "users",
          "email",
          user.email
        ),
        // Check if username is not already in use
        usernameInUse: await validator.validateIsExistsAsync(
          "users",
          "username",
          user.username
        ),
        // Compare username against user validation constrains min username length
        usernameShort: validator.validateTooShort(
          user.username,
          userConstrains.username.minLength
        ),
        // Compare username against user validation constrains max username length
        usernameLong: validator.validateTooLong(
          user.username,
          userConstrains.username.maxLength
        ),
        // Compare password against user validation constrains min password length
        passwordShort: validator.validateTooShort(
          user.password,
          userConstrains.password.minLength
        ),
        // Compare password against user validation constrains max password length
        passwordLong: validator.validateTooLong(
          user.password,
          userConstrains.password.maxLength
        ),
        // Check if the two passwords match
        passwordMatch: validator.validateCompare(
          user.password,
          user.confirmPassword
        ),
        // Compare technologies against user validation constrains min technologies length
        technologiesRequired: validator.validateTooShort(
          user.technologies,
          userConstrains.technologies.minLength
        ),
        // Compare technologies against user validation constrains max technologies length
        languagesRequired: validator.validateTooShort(
          user.languages,
          userConstrains.languages.minLength
        ),
        // Compare bio against user validation constrains max bio length
        bioLong: validator.validateTooLong(
          user.bio,
          userConstrains.bio.maxLength
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
