const express = require('express')

const {
  createApplication,
  getApplicationsByPosition,
  acceptApplication,
  declineApplication
} = require('../controllers/controller-application')

const { auth } = require('../middlewares/middleware-auth')

const router = express.Router()

router.post('/', auth, createApplication)
router.get('/:position', auth, getApplicationsByPosition)
router.post('/accept', auth, acceptApplication)
router.post('/decline', auth, declineApplication)


module.exports = router