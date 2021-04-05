const express = require('express')
const router = express.Router()

const adminRoutes = require('../routes/router-admin')

router.use('/admin', adminRoutes)

router.get('/ping', (req, res) => {
    res.send('pong')
})

router.all('*', (req, res) => {
    res.status(404).json({
        status: 404,
        message: "page doesn't exist"
    })
})

module.exports = router