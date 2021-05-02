const express = require('express')
const router = express.Router()

const { listRoles, requestRole } = require('../controllers/controller-role')
const { auth } = require('../middlewares/middleware-auth')

router.get('/', listRoles)
router.post('/', auth, requestRole)

module.exports = router