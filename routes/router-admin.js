const express = require('express')
const router = express.Router()

const { createTables, deleteEverything, clearAllTables, addTechnologies, addLanguages, addRoles, addLevels, createViews } = require('../controllers/controller-admin')

router.route('/tech').post(addTechnologies)
router.route('/lang').post(addLanguages)
router.route('/role').post(addRoles)
router.route('/level').post(addLevels)
router.route('/create-tables').post(createTables)
router.route('/clear-tables').post(clearAllTables)
router.route('/create-views').post(createViews)
router.route('/delete-everything').post(deleteEverything)

module.exports = router