const express = require('express')
const router = express.Router()

const { createTables, clearAllTables, addTechnologies, addLanguages } = require('../controllers/controller-admin')

// router.route('/tech').post(addTechnologies)
// router.route('/lang').post(addLanguages)
router.route('/create-tables').post(createTables)
// router.route('/clear-tables').post(clearAllTables)

module.exports = router