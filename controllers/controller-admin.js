const knex = require('../config/db')

const technologies = require('../data/technologies')
const languages = require('../data/languages')

const { insertTechnologies, insertLanguages } = require('../helpers/db-helpers')

exports.createTables = async (req, res) => {
    try {
        await knex.schema.dropTableIfExists('job')
        await knex.schema.dropTableIfExists('project')
        await knex.schema.dropTableIfExists('user')
        await knex.schema.dropTableIfExists('language')
        await knex.schema.dropTableIfExists('technology')

        await knex.schema.createTable('user', function (table) {
            table.integer('user_id').unsigned().primary()
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

        await knex.schema.createTable('job', function (table) {
            table.increments('job_id').unsigned().primary()
            table.string('title').notNullable()
            table.string('sortTitle').notNullable()
            table.text('description').notNullable()
            table.timestamp('created_at').defaultTo(knex.fn.now())
        });

        await knex.schema.createTable('language', function (table) {
            table.increments('language_id').unsigned().primary()
            table.string('name').notNullable().unique()
            table.string('code', 2).notNullable().unique()
            table.timestamp('created_at').defaultTo(knex.fn.now())
        });
        
        await knex.schema.createTable('technology', function (table) {
            table.increments('technology_id').unsigned().primary()
            table.string('name').notNullable().unique()
            table.integer('status', 1).notNullable().defaultTo(1)
            table.timestamp('created_at').defaultTo(knex.fn.now())
        });

        res.send('Databases created')
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
        res.send(error.message)
    }
}

exports.addLanguages = async (req, res) => {
    try {
        // TODO: add email check when user routes were created
        await knex.schema.dropTable('language')
        insertLanguages(languages)
        res.send('Languages were added')
    } catch (error) {
        res.send(error.message)
    }
}