const express = require('express')
const router = express.Router()

const { createUser, loginUser } = require('../controllers/controller-user')
const { registerUserValidation } = require('../middlewares/validation')

router.route('/register').post(registerUserValidation, createUser)
router.route('/login').post(loginUser)

module.exports = router