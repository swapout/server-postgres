const express = require('express')

const {
  createProject,
  getProjectById,
  getAllProjects,
  getProjectsByUser,
  updateProjectById,
  deleteProjectById
} = require('../controllers/controller-project')

const { auth } = require('../middlewares/middleware-auth')
const { createProjectValidation } = require('../middlewares/validation')

const router = express.Router()

router.post('/', auth, createProjectValidation, createProject)
router.get('/', auth, getAllProjects)
router.get('/user', auth, getProjectsByUser)
router.get('/:id', auth, getProjectById)
router.patch('/:id', auth, updateProjectById)
router.delete('/:id', auth, deleteProjectById)

module.exports = router