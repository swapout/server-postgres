const express = require('express')
const router = express.Router()

const { fakeUser, fakeProject, fakePosition } = require('../controllers/controller-fake')
const { auth } = require('../middlewares/middleware-auth')

router.route('/user').post(auth, fakeUser)
router.route('/project').post(auth, fakeProject)
router.route('/position').post(auth, fakePosition)

module.exports = router