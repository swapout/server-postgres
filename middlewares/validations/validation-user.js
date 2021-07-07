const { validator } = require("../../helpers/validators");
const { userConstrains } = require("../../data/validation-constrains");

exports.registerUserValidation = async (req, res, next) => {
  try {
    const { user } = req.body;
    let validationErrors = {};
    let missingFields;
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

    missingFields = validator.validateRequiredFields(requiredFields, user);

    if (missingFields.length === 0) {
      // Create validation error object to track errors
      validationErrors = {
        invalidEmail: validator.validatePattern(
          user.email,
          userConstrains.email.pattern
        ),
        emailInUse: await validator.validateIsExistsAsync(
          "users",
          "email",
          user.email
        ),
        usernameInUse: await validator.validateIsExistsAsync(
          "users",
          "username",
          user.username
        ),
        usernameShort: validator.validateTooShort(
          user.username,
          userConstrains.username.minLength
        ),
        usernameLong: validator.validateTooLong(
          user.username,
          userConstrains.username.maxLength
        ),
        passwordShort: validator.validateTooShort(
          user.password,
          userConstrains.password.minLength
        ),
        passwordLong: validator.validateTooLong(
          user.password,
          userConstrains.password.maxLength
        ),
        passwordMatch: validator.validateCompare(
          user.password,
          user.confirmPassword
        ),
        technologiesRequired: validator.validateTooShort(
          user.technologies,
          userConstrains.technologies.minLength
        ),
        languagesRequired: validator.validateTooShort(
          user.languages,
          userConstrains.languages.minLength
        ),
        bioLong: validator.validateTooLong(
          user.bio,
          userConstrains.bio.maxLength
        ),
      };
    }

    // Loop through the validation error object and see if any of them is true
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
