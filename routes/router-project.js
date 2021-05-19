const express = require('express')

const {
  createProject,
  getProjectById,
  getAllProjects,
  getProjectsByUser,
  updateProjectById,
  deleteProjectById,
  removeCollaborator
} = require('../controllers/controller-project')

const { auth } = require('../middlewares/middleware-auth')
const { createProjectValidation } = require('../middlewares/validations/validation-project')

const router = express.Router()

router.post('/', auth, createProjectValidation, createProject)
router.get('/', auth, getAllProjects)
router.get('/user', auth, getProjectsByUser)
router.get('/:id', auth, getProjectById)
router.patch('/:id', auth, updateProjectById)
router.delete('/:id', auth, deleteProjectById)
router.post('/collaborator', auth, removeCollaborator)

module.exports = router