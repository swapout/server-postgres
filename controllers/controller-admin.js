const knex = require('../config/db')

const technologies = require('../data/technologies')
const languages = require('../data/languages')

const { insertTechnologies, insertLanguages } = require('../helpers/db-helpers')

exports.createTables = async (req, res) => {
  try {
    await knex.schema.dropTableIfExists('user_language_relation')
    await knex.schema.dropTableIfExists('user_technology_relation')
    await knex.schema.dropTableIfExists('project_technology_relation')
    await knex.schema.dropTableIfExists('project_job_relation')
    await knex.schema.dropTableIfExists('job_technology_relation')
    await knex.schema.dropTableIfExists('job')
    await knex.schema.dropTableIfExists('collaborator')
    await knex.schema.dropTableIfExists('project')
    await knex.schema.dropTableIfExists('bearer_token')
    await knex.schema.dropTableIfExists('reset_password_token')
    await knex.schema.dropTableIfExists('language')
    await knex.schema.dropTableIfExists('user')
    await knex.schema.dropTableIfExists('technology')

    await knex.schema.createTable('user', function (table) {
      table.increments('user_id').unsigned().primary()
      table.string('avatar').notNullable()
      table.string('username').notNullable().unique()
      table.string('email').notNullable().unique()
      table.string('password', 128).notNullable()
      table.string('githubURL')
      table.string('gitlabURL')
      table.string('bitbucketURL')
      table.string('linkedinURL')
      table.text('bio')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('bearer_token', function (table) {
      table.increments('bearer_token_id').unsigned().primary()
      table.text('bearer_token').notNullable()
      table.integer('user_id').unsigned().references('user_id').inTable('user')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('reset_password_token', function (table) {
      table.increments('reset_password_token_id').unsigned().primary()
      table.text('reset_password_token').notNullable()
      table.integer('user_id').unsigned().references('user_id').inTable('user')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('project', function (table) {
      table.increments('project_id').unsigned().primary()
      table.string('name').notNullable()
      table.string('sortName').notNullable()
      table.integer('owner').unsigned().references('user_id').inTable('user')
      table.text('description')
      table.string('projectURL')
      table.boolean('jobsAvailable')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('collaborator', function (table) {
      table.increments('collaborator_id').unsigned().primary()
      table.integer('user_id').unsigned().references('user_id').inTable('user')
      table.integer('project_id').unsigned().references('project_id').inTable('project')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('job', function (table) {
      table.increments('job_id').unsigned().primary()
      table.string('title').notNullable()
      table.string('sortTitle').notNullable()
      table.text('description').notNullable()
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('language', function (table) {
      table.string('value').notNullable().unique()
      table.string('label').primary()
      table.string('code', 2).notNullable().unique().defaultTo(null)
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('technology', function (table) {
      table.string('value').notNullable().unique()
      table.string('label').primary()
      table.integer('status', 1).notNullable().defaultTo(1)
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('job_technology_relation', function (table) {
      table.increments('job_technology_relation_id').unsigned().primary()
      table.integer('job_id').unsigned().references('job_id').inTable('job')
      table.string('label').references('label').inTable('technology')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('project_job_relation', function (table) {
      table.increments('project_job_relation_id').unsigned().primary()
      table.integer('project_id').unsigned().references('project_id').inTable('project')
      table.integer('job_id').unsigned().references('job_id').inTable('job')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('project_technology_relation', function (table) {
      table.increments('project_technology_relation_id').unsigned().primary()
      table.integer('project_id').unsigned().references('project_id').inTable('project')
      table.string('label').references('label').inTable('technology')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('user_language_relation', function (table) {
      table.increments('user_language_relation_id').unsigned().primary()
      table.integer('user_id').unsigned()
      table.string('label').references('label').inTable('language')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

    await knex.schema.createTable('user_technology_relation', function (table) {
      table.increments('user_technology_relation_id').unsigned().primary()
      table.integer('user_id').unsigned().references('user_id').inTable('user')
      table.string('label').references('label').inTable('technology')
      table.timestamp('created_at').defaultTo(knex.fn.now())
    });

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
  try {
    await knex('user_language_relation').del()
    await knex('user_technology_relation').del()
    await knex('project_technology_relation').del()
    await knex('project_job_relation').del()
    await knex('job_technology_relation').del()
    await knex('job').del()
    await knex('collaborator').del()
    await knex('project').del()
    await knex('bearer_token').del()
    await knex('reset_password_token').del()
    // await knex('language').del()
    await knex('user').del()
    // await knex('technology').del()

    res.send('All tables were emptied')
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.addTechnologies = async (req, res) => {
  try {
    // TODO: add email check when user routes were created
    await insertTechnologies(technologies)
    res.send('Technologies were added')
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.addLanguages = async (req, res) => {
  try {
    // TODO: add email check when user routes were created
    insertLanguages(languages)
    res.send('Languages were added')
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}