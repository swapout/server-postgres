const express = require('express')
const router = express.Router()

const adminRoutes = require('../routes/router-admin')
const userRoutes = require('../routes/router-user')
const projectRoutes = require('../routes/router-project')
const fakeRoutes = require('../routes/router-fake')

router.use('/user', userRoutes)
router.use('/project', projectRoutes)

if(process.env.NODE_ENV === 'dev') {
  router.use('/fake', fakeRoutes)
  router.use('/admin', adminRoutes)
}

router.all('*', (req, res) => {
  res.status(404).json({
    status: 404,
    message: "page doesn't exist"
  })
})

module.exports = router