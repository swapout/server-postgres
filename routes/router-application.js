const express = require('express')

const {
  createApplication,
  getApplicationsByPosition,
  acceptApplication
} = require('../controllers/controller-application')

const { auth } = require('../middlewares/middleware-auth')

const router = express.Router()

router.post('/', auth, createApplication)
router.get('/:position', auth, getApplicationsByPosition)
router.post('/accept', auth, acceptApplication)

module.exports = router