const express = require('express')
const router = express.Router()

const { createUser } = require('../controllers/controller-user')

router.route('/register').post(createUser)

module.exports = router