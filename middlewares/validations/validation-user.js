const { userValidator: validator } = require("../../helpers/validators");

exports.registerUserValidation = async (req, res, next) => {
  try {
    const { user } = req.body;

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

    const missingFields = validator.validateRequiredFields(
      requiredFields,
      user
    );

    // const requiredFieldsLogin = ["email", "password"];
    // const requiredFieldsUpdateUser = [
    //   "githubURL",
    //   "gitlabURL",
    //   "bitbucketURL",
    //   "linkedinURL",
    //   "technologies",
    //   "languages",
    //   "bio",
    // ];
    // const requiredFieldsUpdateUsername = ["newUsername", "password"];
    // const requiredFieldsUpdatePassword = [
    //   "currentPassword",
    //   "newPassword",
    //   "newPasswordConfirm",
    // ];
    // const requiredFieldsUpdateEmail = ["newEmail", "password"];

    // const missingFields = requiredFields.filter((field) => {
    //   if (!user.hasOwnProperty(field)) {
    //     return field;
    //   }
    // });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation errors",
        missingFields,
      });
    }

    // Create validation error object to track errors
    const validationErrors = {
      invalidEmail: validator.validateEmailPattern(user.email),
      emailInUse: await validator.validateEmailAsync(user.email),
      usernameInUse: await validator.validateUsernameAsync(user.username),
      usernameShort: validator.validateUsernameShort(user.username),
      usernameLong: validator.validateUsernameLong(user.username),
      passwordShort: validator.validatePasswordShort(user.password),
      passwordLong: validator.validatePasswordLong(user.password),
      passwordMatch: validator.validateComparePasswords(
        user.password,
        user.confirmPassword
      ),
      technologiesRequired: validator.validateTechnologies(user.technologies),
      languagesRequired: validator.validateLanguages(user.languages),
    };

    // Validate email
    // const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    // validationErrors.invalidEmail = !emailRegex.test(user.email);

    // // Check if email or username already exist in the BD
    // const isExistingUser = await pool.query(
    //   `
    //     SELECT email, username FROM users WHERE email = $1 OR username = $2;
    //   `,
    //   [user.email, user.username]
    // );
    //
    // //Check if any user was returned
    // if (isExistingUser.rows.length > 0) {
    //   isExistingUser.rows.map((usr) => {
    //     // Check if it was an email match
    //     if (usr.email === user.email) {
    //       validationErrors.emailInUse = true;
    //     }
    //     // Check if it was a username match
    //     if (usr.username === user.username) {
    //       validationErrors.usernameInUse = true;
    //     }
    //   });
    // }

    // // Check if the password is within range
    // if (user.password.length < 8) {
    //   validationErrors.passwordShort = true;
    // } else if (user.password.length > 128) {
    //   validationErrors.passwordLong = true;
    // }

    // // Check if the two password match
    // if (user.password !== user.confirmPassword) {
    //   validationErrors.passwordMatch = true;
    // }

    // // Check if technologies array has a value
    // if (user.technologies.length === 0) {
    //   validationErrors.technologiesRequired = true;
    // }
    //
    // // Check if languages array has a value
    // if (user.languages.length === 0) {
    //   validationErrors.languagesRequired = true;
    // }

    // Loop through the validation error object and see if any of them is true
    if (Object.values(validationErrors).includes(true)) {
      return res.status(400).json({
        status: 400,
        message: "Validation errors",
        validationErrors,
        missingFields: [],
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
