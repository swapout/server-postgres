const express = require('express')
const router = express.Router()

const { createUser, loginUser, getUserProfile } = require('../controllers/controller-user')
const { registerUserValidation } = require('../middlewares/validation')
const { auth } = require('../middlewares/middleware-auth')

router.route('/register').post(registerUserValidation, createUser)
router.route('/login').post(loginUser)
router.get('/', auth, getUserProfile)

module.exports = router