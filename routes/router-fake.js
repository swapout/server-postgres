const express = require('express')
const router = express.Router()

const { fakeUser, fakeProject } = require('../controllers/controller-fake')
const { auth } = require('../middlewares/middleware-auth')

router.route('/user').post(auth, fakeUser)
router.route('/project').post(auth, fakeProject)

module.exports = router