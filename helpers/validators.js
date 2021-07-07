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
  validateCompare: (value, confirmValue) => value !== confirmValue,
  validateRequiredFields: (requiredFields, comparator) => {
    return requiredFields.filter((field) => {
      if (!comparator.hasOwnProperty(field)) {
        return field;
      }
    });
  },
};
