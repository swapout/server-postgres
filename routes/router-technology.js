const express = require('express')
const {
  listTechnologies,
  getTechnologiesByProjectId,
  requestTechnology
} = require('../controllers/controller-technology')
const { auth } = require('../middlewares/middleware-auth')
const router = express.Router()

router.get('/', listTechnologies)
router.post('/', auth, requestTechnology)
router.get('/project/:id', auth, getTechnologiesByProjectId)

module.exports = router