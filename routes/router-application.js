const express = require('express')

const {
  createApplication,
  getApplicationsByPosition
} = require('../controllers/controller-application')

const { auth } = require('../middlewares/middleware-auth')

const router = express.Router()

router.post('/', auth, createApplication)
router.get('/:position', auth, getApplicationsByPosition)

module.exports = router