const express = require('express')
const router = express.Router()

const { fakeUser, fakeProject, fakePosition, fakeApplication } = require('../controllers/controller-fake')
const { auth } = require('../middlewares/middleware-auth')

router.route('/user').post(auth, fakeUser)
router.route('/project').post(auth, fakeProject)
router.route('/position').post(auth, fakePosition)
router.route('/application').post(auth, fakeApplication)

module.exports = router