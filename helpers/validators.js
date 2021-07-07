const { pool } = require("../config/db");

exports.userValidator = {
  validateEmailPattern: (email) => {
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return !emailRegex.test(email);
  },
  validateUsernameAsync: async (username) => {
    const isExists = await pool.query(
      `
        select exists(select 1 from users where username = $1) AS "exists"
      `,
      [username]
    );
    return isExists.rows[0].exists;
  },
  validateUsernameShort: (username) => username.length < 3,
  validateUsernameLong: (username) => username.length > 20,
  validateEmailAsync: async (email) => {
    const isExists = await pool.query(
      `
        select exists(select 1 from users where email = $1) AS "exists"
      `,
      [email]
    );
    return isExists.rows[0].exists;
  },
  validatePasswordShort: (password) => password.length < 8,
  validatePasswordLong: (password) => password.length > 128,
  validateComparePasswords: (password, confirmPassword) =>
    password !== confirmPassword,
  validateTechnologies: (technologies) => technologies.length === 0,
  validateLanguages: (languages) => languages.length === 0,
  validateRequiredFields: (requiredFields, comparator) => {
    return requiredFields.filter((field) => {
      if (!comparator.hasOwnProperty(field)) {
        return field;
      }
    });
  },
};
