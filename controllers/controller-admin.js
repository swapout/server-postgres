const knex = require('../config/db')

const technologies = require('../data/technologies')
const languages = require('../data/languages')

const { insertTechnologies, insertLanguages } = require('../helpers/db-helpers')

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