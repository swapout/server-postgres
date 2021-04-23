const express = require('express')
const router = express.Router()

const { listRoles } = require('../controllers/controller-role')

router.get('/', listRoles)

module.exports = router