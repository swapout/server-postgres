const express = require('express')

const {
  createPosition,
  getPositionById,
  getPositionsByProject,
  getAllPositions,
  updatePositionById,
  deletePositionById
} = require('../controllers/controller-position')

const { auth } = require('../middlewares/middleware-auth')
const { createPositionValidation } = require('../middlewares/validations/validation-position')

const router = express.Router()

router.post('/', auth, createPositionValidation, createPosition)
router.get('/', auth, getAllPositions)
router.get('/project/:id', auth, getPositionsByProject)
router.get('/:id', auth, getPositionById)
router.patch('/:id', auth, updatePositionById)
router.delete('/:id', auth, deletePositionById)

module.exports = router