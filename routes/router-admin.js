const express = require('express')
const router = express.Router()

const { createTables, clearAllTables, addTechnologies, addLanguages, createViews } = require('../controllers/controller-admin')

router.route('/tech').post(addTechnologies)
router.route('/lang').post(addLanguages)
router.route('/create-tables').post(createTables)
router.route('/clear-tables').post(clearAllTables)
router.route('/create-views').post(createViews)

module.exports = router