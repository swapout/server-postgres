const express = require('express')
const router = express.Router()

const { createUser, loginUser, getUserProfile, deleteUser, logout } = require('../controllers/controller-user')
const { registerUserValidation } = require('../middlewares/validation')
const { auth } = require('../middlewares/middleware-auth')

router.route('/register').post(registerUserValidation, createUser)
router.route('/login').post(loginUser)
router.get('/', auth, getUserProfile)
router.delete('/', auth, deleteUser)

router.get('/logout', auth, logout)

module.exports = router