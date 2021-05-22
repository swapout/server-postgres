const {
  HttpError,
  HttpBadRequest,
  HttpUnauthorized,
  HttpForbidden,
  HttpNotFound,
  HttpConflict,
  HttpInternalServerError,
  HttpServiceUnavailable
} = require('../utils/error/CustomError')

const httpResponseCodes = require('../utils/error/httpErrorCodes')

function attachResponder(req, res, next) {
  res.respond = createResponder(req, res, next);
  next();
}

function createResponder(req, res, next) {
  const responder = {
    _forwardError(error, ErrorClass = Error, data) {
      const errorMessage = error instanceof Error ? error.message : error;
      const errorToForward = new ErrorClass(errorMessage, data);
      // forwards error to an error handler middleware
      next(errorToForward);
    },

    badRequest(error, data) {
      return responder._forwardError(error, HttpBadRequest, data);
    },
    unauthorized(error, data) {
      return responder._forwardError(error, HttpUnauthorized, data);
    },
    forbidden(error, data) {
      return responder._forwardError(error, HttpForbidden, data);
    },
    notFound(error, data) {
      return responder._forwardError(error, HttpNotFound, data);
    },
    conflict(error, data) {
      return responder._forwardError(error, HttpConflict, data);
    },
    internalServerError(error, data) {
      return responder._forwardError(error, HttpInternalServerError, data);
    },
    serviceUnavailable(error, data) {
      return responder._forwardError(error, HttpServiceUnavailable, data);
    }
  };

  return responder;
}

function errorHandler(error, req, res, next) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json(error.data)
  } else {
    res.sendStatus(httpResponseCodes.INTERNAL_SERVER_ERROR)
  }
}

module.exports = {
  attachResponder,
  createResponder,
  errorHandler
}
