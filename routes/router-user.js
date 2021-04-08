const express = require('express')
const router = express.Router()

const { createUser } = require('../controllers/controller-user')
const { registerUserValidation } = require('../middlewares/validation')

router.route('/register').post(registerUserValidation, createUser)

module.exports = router