const express = require('express')

const {
  createApplication
} = require('../controllers/controller-application')

const { auth } = require('../middlewares/middleware-auth')

const router = express.Router()

router.post('/', auth, createApplication)

module.exports = router