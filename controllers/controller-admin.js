const { pool } = require('../config/db')

const technologies = require('../data/technologies')
const languages = require('../data/languages')

const { insertTechnologies, insertLanguages } = require('../helpers/db-helpers')

exports.createTables = async (req, res) => {
  try {
    await pool.query('DROP TABLE positions')
    await pool.query('DROP TABLE collaborators')
    await pool.query('DROP TABLE projects')
    await pool.query('DROP TABLE bearer_tokens')
    await pool.query('DROP TABLE reset_password_tokens')
    await pool.query('DROP TABLE languages')
    await pool.query('DROP TABLE users')

    // await knex.schema.dropTableIfExists('user_language_relation')
    // await knex.schema.dropTableIfExists('user_technology_relation')
    // await knex.schema.dropTableIfExists('project_technology_relation')
    // await knex.schema.dropTableIfExists('project_job_relation')
    // await knex.schema.dropTableIfExists('job_technology_relation')
    // await knex.schema.dropTableIfExists('job')
    // await knex.schema.dropTableIfExists('collaborator')
    // await knex.schema.dropTableIfExists('project')
    // await knex.schema.dropTableIfExists('bearer_token')
    // await knex.schema.dropTableIfExists('reset_password_token')
    // await knex.schema.dropTableIfExists('language')
    // await knex.schema.dropTableIfExists('user')
    // await knex.schema.dropTableIfExists('technology')
    //

    await pool.query(
      `CREATE TABLE users (
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

    await pool.query(
      `CREATE TABLE bearer_tokens (
        id SERIAL PRIMARY KEY,
        bearer_token TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
       );`
    )

    await pool.query(
      `CREATE TABLE reset_password_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
       );`
    )

    await pool.query(
      `CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        projectURL VARCHAR(255),
        jobsAvailable BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
       );`
    )

    await pool.query(
      `CREATE TABLE collaborators (
        id SERIAL PRIMARY KEY,
        position VARCHAR(128),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE
       );`
    )

    await pool.query(
      `CREATE TABLE positions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
       );`
    )

    await pool.query(
      `CREATE TABLE languages (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        value VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(2) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
       );`
    )


    // await knex.schema.createTable('technology', function (table) {
    //   table.string('value').notNullable().unique()
    //   table.string('label').primary()
    //   table.integer('status', 1).notNullable().defaultTo(1)
    //   table.timestamp('created_at').defaultTo(knex.fn.now())
    // });
    //
    // await knex.schema.createTable('job_technology_relation', function (table) {
    //   table.increments('job_technology_relation_id').unsigned().primary()
    //   table.integer('job_id').unsigned().references('job_id').inTable('job')
    //   table.string('label').references('label').inTable('technology')
    //   table.timestamp('created_at').defaultTo(knex.fn.now())
    // });
    //
    // await knex.schema.createTable('project_job_relation', function (table) {
    //   table.increments('project_job_relation_id').unsigned().primary()
    //   table.integer('project_id').unsigned().references('project_id').inTable('project')
    //   table.integer('job_id').unsigned().references('job_id').inTable('job')
    //   table.timestamp('created_at').defaultTo(knex.fn.now())
    // });
    //
    // await knex.schema.createTable('project_technology_relation', function (table) {
    //   table.increments('project_technology_relation_id').unsigned().primary()
    //   table.integer('project_id').unsigned().references('project_id').inTable('project')
    //   table.string('label').references('label').inTable('technology')
    //   table.timestamp('created_at').defaultTo(knex.fn.now())
    // });
    //
    // await knex.schema.createTable('user_language_relation', function (table) {
    //   table.increments('user_language_relation_id').unsigned().primary()
    //   table.integer('user_id').unsigned()
    //   table.string('label').references('label').inTable('language')
    //   table.timestamp('created_at').defaultTo(knex.fn.now())
    // });
    //
    // await knex.schema.createTable('user_technology_relation', function (table) {
    //   table.increments('user_technology_relation_id').unsigned().primary()
    //   table.integer('user_id').unsigned().references('user_id').inTable('user')
    //   table.string('label').references('label').inTable('technology')
    //   table.timestamp('created_at').defaultTo(knex.fn.now())
    // });
    //
    res.send('Tables created')
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.clearAllTables = async (req, res) => {
  // try {
  //   await knex('user_language_relation').del()
  //   await knex('user_technology_relation').del()
  //   await knex('project_technology_relation').del()
  //   await knex('project_job_relation').del()
  //   await knex('job_technology_relation').del()
  //   await knex('job').del()
  //   await knex('collaborator').del()
  //   await knex('project').del()
  //   await knex('bearer_token').del()
  //   await knex('reset_password_token').del()
  //   // await knex('language').del()
  //   await knex('user').del()
  //   // await knex('technology').del()
  //
  //   res.send('All tables were emptied')
  // } catch (error) {
  //   console.log(error.message)
  //   return res.status(500).json({
  //     status: 500,
  //     message: 'Server error'
  //   })
  // }
}

exports.addTechnologies = async (req, res) => {
  // try {
  //   // TODO: add email check when user routes were created
  //   await insertTechnologies(technologies)
  //   res.send('Technologies were added')
  // } catch (error) {
  //   console.log(error.message)
  //   return res.status(500).json({
  //     status: 500,
  //     message: 'Server error'
  //   })
  // }
}

exports.addLanguages = async (req, res) => {
  // try {
  //   // TODO: add email check when user routes were created
  //   insertLanguages(languages)
  //   res.send('Languages were added')
  // } catch (error) {
  //   console.log(error.message)
  //   return res.status(500).json({
  //     status: 500,
  //     message: 'Server error'
  //   })
  // }
}