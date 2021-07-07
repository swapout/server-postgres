const { pool } = require("../config/db");
const format = require("pg-format");

/**
 * @description Validator object that contains all reusable validator functions.
 * @type {
 * {
 * validateTooLong: (function(any[] || string, number): boolean),
 * validateIsExistsAsync: (function(string, string, any): boolean),
 * validateRequiredFields: (function(string[], object): string[]),
 * validateTooShort: (function(any[] || string, number): boolean),
 * validateCompare: (function(string, string): boolean),
 * validatePattern: (function(string, regex): boolean)
 * }
 * }
 */
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
