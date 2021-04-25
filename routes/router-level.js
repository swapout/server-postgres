const express = require('express')
const router = express.Router()

const { listLevels } = require('../controllers/controller-level')

router.get('/', listLevels)

module.exports = router