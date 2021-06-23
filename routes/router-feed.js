const express = require('express')
const router = express.Router()

const { getUserFeed } = require('../controllers/controller-feed')

router.get('/', getUserFeed)