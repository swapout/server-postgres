const express = require('express')
const router = express.Router()

const { createUser, loginUser, getUserProfile, deleteUser, updateUser, updateUsername, updateEmail, updatePassword, logout, logoutAll, passwordReset } = require('../controllers/controller-user')
const { registerUserValidation } = require('../middlewares/validation')
const { auth } = require('../middlewares/middleware-auth')

router.route('/register').post(registerUserValidation, createUser)
router.route('/login').post(loginUser)
router.route('/').get(auth, getUserProfile)
router.route('/').delete(auth, deleteUser)
router.route('/').patch(auth, updateUser)
router.route('/logout').get(auth, logout)
router.route('/logout/all').get(auth, logoutAll)
router.route('/password').patch(auth, updatePassword)
router.route('/username').patch(auth, updateUsername)
router.route('/email').patch(auth, updateEmail)
router.route('/password-reset').post(auth, passwordReset)

module.exports = router