const express = require('express')
const {/*generateTechnologiesFromArray, */ listTechnologies/*, updateTechnologyName, deleteOneTechnology, deleteAllTechnologies*/} = require('../controllers/controller-technology')
// const { auth } = require('../middlewares/middleware-auth')
const router = express.Router()

// router.post('/generate', auth, generateTechnologiesFromArray)
router.get('/', listTechnologies)
// router.patch('/name', auth, updateTechnologyName)
// router.delete('/', auth, deleteOneTechnology)
// router.delete('/all', auth, deleteAllTechnologies)

module.exports = router