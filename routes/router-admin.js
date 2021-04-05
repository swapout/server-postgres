const express = require('express')
const router = express.Router()

const { addTechnologies, addLanguages } = require('../controllers/controller-admin')

router.route('/tech').post(addTechnologies)
router.route('/lang').post(addLanguages)

module.exports = router