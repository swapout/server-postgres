const { pool } = require("../config/db");
const format = require("pg-format");

const technologies = require("../data/technologies");
const languages = require("../data/languages");
const roles = require("../data/roles");
const levels = require("../data/levels");

exports.createTables = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");
  try {
    await client.query(
      `
        CREATE TYPE status AS enum ('accepted', 'declined', 'pending');
      `
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        avatar VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(128) NOT NULL,
        githubURL VARCHAR(255),
        gitlabURL VARCHAR(255),
        bitbucketURL VARCHAR(255),
        linkedinURL VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS bearer_tokens (
        id SERIAL PRIMARY KEY,
        bearer_token TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS reset_password_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        mission TEXT NOT NULL,
        projectURL VARCHAR(255),
        hasPositions BOOLEAN DEFAULT FALSE,
        owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS collaborators (
        id SERIAL PRIMARY KEY,
        position VARCHAR(128),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        qualifications TEXT,
        duties TEXT,
        level INTEGER NOT NULL DEFAULT 1,
        role INTEGER NOT NULL,
        vacancies INTEGER default 1,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS technologies (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        status status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS languages (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(2) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        status status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS levels (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        status status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS positions_technologies_relations (
        id SERIAL PRIMARY KEY,
        position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
        technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS positions_applications_relations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
        status status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, position_id)
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS projects_technologies_relations (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS users_languages_relations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS users_technologies_relations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    );
    await client.query("COMMIT");
    res.send("Tables created");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.deleteEverything = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    await client.query(
      `
        DROP VIEW IF EXISTS user_lang;
        DROP VIEW IF EXISTS user_tech;
        DROP VIEW IF EXISTS project_tech;
        DROP VIEW IF EXISTS position_tech;
        DROP TABLE IF EXISTS positions_technologies_relations;
        DROP TABLE IF EXISTS positions_applications_relations;
        DROP TABLE IF EXISTS users_technologies_relations;
        DROP TABLE IF EXISTS users_languages_relations;
        DROP TABLE IF EXISTS projects_technologies_relations;
        DROP TABLE IF EXISTS positions;
        DROP TABLE IF EXISTS collaborators;
        DROP TABLE IF EXISTS projects;
        DROP TABLE IF EXISTS technologies;
        DROP TABLE IF EXISTS roles;
        DROP TABLE IF EXISTS levels;
        DROP TABLE IF EXISTS bearer_tokens;
        DROP TABLE IF EXISTS reset_password_tokens;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS languages;
        DROP TYPE IF EXISTS status;
      `
    );

    await client.query("COMMIT");
    res.send("Tables were deleted");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.clearAllTables = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM users_languages_relations;
       DELETE FROM users_technologies_relations;
       DELETE FROM projects_technologies_relations;
       DELETE FROM positions_applications_relations;
       DELETE FROM positions_technologies_relations;
       DELETE FROM positions;
       DELETE FROM collaborators;
       DELETE FROM projects;
       DELETE FROM bearer_tokens;
       DELETE FROM reset_password_tokens;
       DELETE FROM users;`
    );
    await client.query("COMMIT");
    res.send("All tables were emptied");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.addTechnologies = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    // TODO: add email check when user routes were created
    const updatedTechnologies = technologies.map((tech) => {
      return [tech.name, "accepted"];
    });

    const sql = format(
      `
      INSERT INTO technologies (label, status)
      VALUES %L;
      `,
      updatedTechnologies
    );

    await client.query(sql);
    await client.query("COMMIT");

    return res.send("Technologies were added");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.addLanguages = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    // TODO: add email check when user routes were created
    const updatedLanguages = languages.map((lang) => {
      return [lang.name, lang.code];
    });

    const sql = format(
      `
      INSERT INTO languages (label, code)
      VALUES %L;
      `,
      updatedLanguages
    );

    await client.query(sql);
    await client.query("COMMIT");

    return res.send("Languages were added");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.addRoles = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    const updatedRoles = roles.map((role) => {
      return [role.label, "accepted"];
    });

    const sql = format(
      `
      INSERT INTO roles (label, status)
      VALUES %L;
      `,
      updatedRoles
    );

    await client.query(sql);
    await client.query("COMMIT");

    return res.send("Roles were added");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.addLevels = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    const updatedLevels = levels.map((level) => {
      return [level.name, "accepted"];
    });

    const sql = format(
      `
      INSERT INTO levels (label, status)
      VALUES %L;
      `,
      updatedLevels
    );

    await client.query(sql);
    await client.query("COMMIT");

    return res.send("Levels were added");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.createViews = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    await client.query(
      `
        CREATE VIEW user_lang AS
          SELECT label, l.id AS language_id, u.id AS user_id, l.code
          FROM users_languages_relations AS ulr
          JOIN languages AS l ON l.id = ulr.language_id
          JOIN users AS u ON u.id = ulr.user_id;
      `
    );
    await client.query(
      `
        CREATE VIEW user_tech AS
          SELECT label, t.id AS technology_id, u.id AS user_id, t.status 
          FROM users_technologies_relations AS utr
          JOIN technologies AS t ON t.id = utr.technology_id
          JOIN users AS u ON u.id = utr.user_id;
      `
    );

    await client.query(
      `
        CREATE VIEW project_tech AS
          SELECT label, t.id AS technology_id, p.id AS project_id 
          FROM projects_technologies_relations AS ptr
          JOIN technologies AS t ON t.id = ptr.technology_id
          JOIN projects AS p ON p.id = ptr.project_id;
      `
    );

    await client.query(
      `
        CREATE VIEW position_tech AS
          SELECT label, t.id AS technology_id, p.id AS position_id 
          FROM positions_technologies_relations AS ptr
          JOIN technologies AS t ON t.id = ptr.technology_id
          JOIN positions AS p ON p.id = ptr.position_id;
      `
    );
    await client.query("COMMIT");
    return res.send("Views were added");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};
