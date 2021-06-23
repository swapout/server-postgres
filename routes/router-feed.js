const express = require('express')
const router = express.Router()

const { auth } = require('../middlewares/middleware-auth')
const { getUserFeed } = require('../controllers/controller-feed')

router.get('/', auth, getUserFeed)

module.exports = router