const { logger } = require('../../helpers/helper-winston')
const {
  httpStatusCodes,
  postgresErrorCodes,
  errorTypes
} = require('./constants')
const { HttpError } = require('./CustomError')

function errorHandler(error, req, res) {
  // console.log(error.name)
  // console.log('Error.code: ', error.code)
  // console.log('Error.errno: ', error.errno)
  // console.log('Error.sqlMessage: ', error.sqlMessage)
  // console.log('Error.sqlState: ', error.sqlState)
  // console.log('Error.index: ', error.index)
  // console.log('Error.sql: ', error.sql)
  // console.log(Object.keys(error))
  console.log(error)
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
      }
    )
  } else {
    if(error.code) {
      if(postgresErrorCodes.includes(error.code.substring(0, 2))){
        logger.log('error', error.message, {
          url: req.url,
          type: errorTypes.POSTGRES_ERROR,
          method: req.method,
          status: httpStatusCodes.INTERNAL_SERVER_ERROR,
          stack: error.stack,
        })
      } else {
        logger.log('error', error.message, {
        url: req.url,
        type: errorTypes.SERVER_ERROR,
        method: req.method,
        status: httpStatusCodes.INTERNAL_SERVER_ERROR,
        stack: error.stack,
        })
      }
    }

    return res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
      status: httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Server error',
    })
  }
}

module.exports = {
  errorHandler,
}