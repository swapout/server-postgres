const express = require('express')
const router = express.Router()

const adminRoutes = require('../routes/router-admin')
const userRoutes = require('../routes/router-user')
const projectRoutes = require('../routes/router-project')

router.use('/admin', adminRoutes)
router.use('/user', userRoutes)
router.use('/project', projectRoutes)

router.all('*', (req, res) => {
  res.status(404).json({
    status: 404,
    message: "page doesn't exist"
  })
})

module.exports = router