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

    // Lower case email address
    user.email = user.email.toLowerCase();
    //Trim user values that shouldn't have spaces before or after
    user.username = user.username.trim();
    user.password = user.password.trim();
    user.githubURL = user.githubURL.trim();
    user.gitlabURL = user.gitlabURL.trim();
    user.bitbucketURL = user.bitbucketURL.trim();
    user.linkedinURL = user.linkedinURL.trim();

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
        githubURLLong: validator.validateTooLong(
          user.githubURL,
          userConstrains.githubURL.maxLength
        ),
        gitlabURLLong: validator.validateTooLong(
          user.gitlabURL,
          userConstrains.gitlabURL.maxLength
        ),
        bitbucketURLLong: validator.validateTooLong(
          user.bitbucketURL,
          userConstrains.bitbucketURL.maxLength
        ),
        linkedinURLShort: user.linkedinURL
          ? validator.validateTooShort(
              user.linkedinURL,
              userConstrains.linkedinURL.minLength
            )
          : false,
        linkedinURLLong: validator.validateTooLong(
          user.linkedinURL,
          userConstrains.linkedinURL.maxLength
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

exports.loginUserValidation = async (req, res, next) => {
  try {
    // Get user data from request body
    const { user } = req.body;
    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = ["email", "password"];

    // Check if all required fields are present and add missing ones to missing fields variable
    missingFields = validator.validateRequiredFields(requiredFields, user);

    // If there are no missing fields on req.body
    if (missingFields.length === 0) {
      // Add and validate each field
      validationErrors = {
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

exports.updateUserDetailsValidation = async (req, res, next) => {
  try {
    // Get user data from request body
    const { user } = req.body;
    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = [
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

exports.updateUserEmailValidation = async (req, res, next) => {
  try {
    // Get user data from request body
    const { user } = req.body;
    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = ["newEmail", "password"];

    // Check if all required fields are present and add missing ones to missing fields variable
    missingFields = validator.validateRequiredFields(requiredFields, user);

    // If there are no missing fields on req.body
    if (missingFields.length === 0) {
      // Add and validate each field
      validationErrors = {
        // Check email, if it's a valid email format
        invalidEmail: validator.validatePattern(
          user.newEmail,
          userConstrains.email.pattern
        ),
        // Check if email is not already in use
        emailInUse: await validator.validateIsExistsAsync(
          "users",
          "email",
          user.newEmail
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

exports.updateUserUsernameValidation = async (req, res, next) => {
  console.log("this runs");
  try {
    // Get user data from request body
    const { user } = req.body;
    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = ["newUsername", "password"];

    // Check if all required fields are present and add missing ones to missing fields variable
    missingFields = validator.validateRequiredFields(requiredFields, user);

    // If there are no missing fields on req.body
    if (missingFields.length === 0) {
      // Add and validate each field
      validationErrors = {
        // Check if username is not already in use
        usernameInUse: await validator.validateIsExistsAsync(
          "users",
          "username",
          user.newUsername
        ),
        // Compare username against user validation constrains min username length
        usernameShort: validator.validateTooShort(
          user.newUsername,
          userConstrains.username.minLength
        ),
        // Compare username against user validation constrains max username length
        usernameLong: validator.validateTooLong(
          user.newUsername,
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

exports.updateUserPasswordValidation = async (req, res, next) => {
  try {
    // Get user data from request body
    const { user } = req.body;
    // Initialize variables
    let validationErrors = {};
    let missingFields;
    // List fields that must be present on the request body
    const requiredFields = [
      "currentPassword",
      "newPassword",
      "newPasswordConfirm",
    ];

    // Check if all required fields are present and add missing ones to missing fields variable
    missingFields = validator.validateRequiredFields(requiredFields, user);

    // If there are no missing fields on req.body
    if (missingFields.length === 0) {
      // Add and validate each field
      validationErrors = {
        // Compare password against user validation constrains min password length
        passwordShort: validator.validateTooShort(
          user.newPassword,
          userConstrains.password.minLength
        ),
        // Compare password against user validation constrains max password length
        passwordLong: validator.validateTooLong(
          user.newPassword,
          userConstrains.password.maxLength
        ),
        // Check if the two passwords match
        passwordMatch: validator.validateCompare(
          user.newPassword,
          user.newPasswordConfirm
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
