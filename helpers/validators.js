const { pool } = require("../config/db");
const format = require("pg-format");

exports.validator = {
  validatePattern: (value, regex) => {
    return !regex.test(value);
  },
  validateIsExistsAsync: async (table, column, value) => {
    const sql = format(
      `
        select exists(select 1 from %1$s where %2$s = %3$L) AS "exists"
      `,
      table,
      column,
      value
    );
    const isExists = await pool.query(sql);
    return isExists.rows[0].exists;
  },
  validateTooShort: (value, minLimit) => value.length < minLimit,
  validateTooLong: (value, maxLimit) => value.length > maxLimit,
  validatePasswordShort: (password) => password.length < 8,
  validatePasswordLong: (password) => password.length > 128,
  validateCompare: (value, confirmValue) => value !== confirmValue,
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
