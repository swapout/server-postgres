const { logger } = require('../../helpers/helper-winston')
const responseCodes = require('../../utils/error/httpErrorCodes')

class HttpError extends Error {
  constructor({ message, name, statusCode, data }) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, HttpError);
  }
}

class HttpBadRequest extends HttpError {
  constructor(message = 'Bad request', data) {
    super({
      message,
      name: "HttpBadRequest",
      statusCode: responseCodes.BAD_REQUEST,
      data
    });
  }
}

class HttpUnauthorized extends HttpError {
  constructor(message = 'Unauthorized', data) {
    super({
      message,
      name: "HttpUnauthorized",
      statusCode: responseCodes.UNAUTHORIZED,
      data
    });
  }
}

class HttpForbidden extends HttpError {
  constructor(message = 'Forbidden', data) {
    super({
      message,
      name: "HttpForbidden",
      statusCode: responseCodes.FORBIDDEN,
      data
    });
  }
}

class HttpNotFound extends HttpError {
  constructor(message = 'Not Found', data) {
    super({
      message,
      name: "HttpNotFound",
      statusCode: responseCodes.NOT_FOUND,
      data
    });
  }
}

class HttpConflict extends HttpError {
  constructor(message = 'Conflict', data) {
    super({
      message,
      name: "HttpConflict",
      statusCode: responseCodes.CONFLICT  ,
      data
    });
  }
}

class HttpInternalServerError extends HttpError {
  constructor(message = 'Internal server error', data) {
    super({
      message,
      name: "HttpInternalServerError",
      statusCode: responseCodes.INTERNAL_SERVER_ERROR,
      data
    });
  }
}

class HttpServiceUnavailable extends HttpError {
  constructor(message = 'Service Unavailable', data) {
    super({
      message,
      name: "HttpServiceUnavailable",
      statusCode: responseCodes.SERVICE_UNAVAILABLE,
      data
    });
  }
}

module.exports = {
  HttpError,
  HttpBadRequest,
  HttpUnauthorized,
  HttpForbidden,
  HttpNotFound,
  HttpConflict,
  HttpInternalServerError,
  HttpServiceUnavailable
}