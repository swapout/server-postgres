const express = require('express')
const router = express.Router()
const conn = require('../config/db')

router.get('/ping', (req, res) => {
    conn.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
    });

    res.send('pong')
})

router.all('*', (req, res) => {
    res.status(404).json({
        status: 404,
        message: "page doesn't exist"
    })
})

module.exports = router