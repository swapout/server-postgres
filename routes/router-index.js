const express = require('express')
const router = express.Router()

const adminRoutes = require('../routes/router-admin')
const userRoutes = require('../routes/router-user')
const technologyRoutes = require('../routes/router-technology')
const languageRoutes = require('../routes/router-language')
const roleRoutes = require('../routes/router-role')
const projectRoutes = require('../routes/router-project')
const positionRoutes = require('../routes/router-position')
const applicationRoutes = require('../routes/router-application')
const fakeRoutes = require('../routes/router-fake')

router.use('/user', userRoutes)
router.use('/project', projectRoutes)
router.use('/position', positionRoutes)
router.use('/technology', technologyRoutes)
router.use('/language', languageRoutes)
router.use('/application', applicationRoutes)
router.use('/role', roleRoutes)


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