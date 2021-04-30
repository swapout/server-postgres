const express = require('express')
const {/*generateTechnologiesFromArray, */ listTechnologies, getTechnologiesByProjectId/*, updateTechnologyName, deleteOneTechnology, deleteAllTechnologies*/} = require('../controllers/controller-technology')
const { auth } = require('../middlewares/middleware-auth')
const router = express.Router()

// router.post('/generate', auth, generateTechnologiesFromArray)
router.get('/', listTechnologies)
// router.patch('/name', auth, updateTechnologyName)
// router.delete('/', auth, deleteOneTechnology)
// router.delete('/all', auth, deleteAllTechnologies)
router.get('/project/:id', auth, getTechnologiesByProjectId)

module.exports = router