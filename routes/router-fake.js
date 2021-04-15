const express = require('express')
const router = express.Router()

const { fakeUser } = require('../controllers/controller-fake')
const { auth } = require('../middlewares/middleware-auth')

router.route('/user').post(auth, fakeUser)

module.exports = router