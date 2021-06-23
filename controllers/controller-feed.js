const { pool } = require('../config/db')

exports.getUserFeed = async (req, res) => {
  try {
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}