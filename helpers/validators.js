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
  validateIsProjectOwner: async (userId, projectId) => {
    const isProjectOwner = await pool.query(
      `
        SELECT owner
        FROM projects
        WHERE owner = $1 and id = $2
        LIMIT 1
      `,
      [userId, projectId]
    );
    return isProjectOwner.rows.length < 1;
  },
  validateProjectIncludesTechnologies: async (technologies, projectId) => {
    if (technologies.length !== 0) {
      const sql = format(
        `
        select *
        from projects p
        join (
            select array_agg(technology_id)::text[] as tech, project_id
            from projects_technologies_relations
            group by project_id
        ) as ptr on ptr.project_id = p.id
        where ptr.tech @> array[%1$L] and p.id = %2$L;
      `,
        technologies,
        projectId
      );
      // Send formed query
      const isProjectIncludesTech = await pool.query(sql);

      // If technologies are not included in the project
      return !(isProjectIncludesTech.rows.length === 0);
    }
    return false;
  },
  validateTooShort: (value, minLimit) => value.length < minLimit,
  validateTooLong: (value, maxLimit) => value.length > maxLimit,
  validateValueTooSmall: (value, minLimit) => value < minLimit,
  validateValueTooBig: (value, maxLimit) => value > maxLimit,
  validateCompare: (value, confirmValue) => value !== confirmValue,
  validateRequiredFields: (requiredFields, comparator) => {
    return requiredFields.filter((field) => {
      if (!comparator.hasOwnProperty(field)) {
        return field;
      }
    });
  },
};
