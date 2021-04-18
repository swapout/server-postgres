const express = require('express')
const {
  listLanguages
} = require('../controllers/controller-language')
const { auth } = require('../middlewares/middleware-auth')
const router = express.Router()


router.get('/', listLanguages)

module.exports = router