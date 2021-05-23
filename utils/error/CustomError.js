const { logger } = require('../../helpers/helper-winston')
const { httpStatusCodes } = require('./constants')

class HttpError extends Error {
  constructor({ message, name, statusCode, data }) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, HttpError);

    logger.log(
      this.data.level,
      this.message,
      {
        url: this.data.url,
        type: this.data.type,
        method: this.data.method,
        status: this.statusCode,
        stack: this.stack,
        user_id: this.data.userId,
        project_id: this.data.projectId,
        position_id: this.data.positionId,
        application_id: this.data.applicationId,
      }
    )
  }
}

class HttpBadRequest extends HttpError {
  constructor(message = 'Bad request', data) {
    super({
      message,
      name: "HttpBadRequest",
      statusCode: httpStatusCodes.BAD_REQUEST,
      data
    });
  }
}

class HttpUnauthorized extends HttpError {
  constructor(message = 'Unauthorized', data) {
    super({
      message,
      name: "HttpUnauthorized",
      statusCode: httpStatusCodes.UNAUTHORIZED,
      data
    });
  }
}

class HttpForbidden extends HttpError {
  constructor(message = 'Forbidden', data) {
    super({
      message,
      name: "HttpForbidden",
      statusCode: httpStatusCodes.FORBIDDEN,
      data
    });
  }
}

class HttpNotFound extends HttpError {
  constructor(message = 'Not Found', data) {
    super({
      message,
      name: "HttpNotFound",
      statusCode: httpStatusCodes.NOT_FOUND,
      data
    });
  }
}

class HttpConflict extends HttpError {
  constructor(message = 'Conflict', data) {
    super({
      message,
      name: "HttpConflict",
      statusCode: httpStatusCodes.CONFLICT,
      data
    });
  }
}

class HttpInternalServerError extends HttpError {
  constructor(message = 'Internal server error', data) {
    super({
      message,
      name: "HttpInternalServerError",
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
      data
    });
  }
}

class HttpServiceUnavailable extends HttpError {
  constructor(message = 'Service Unavailable', data) {
    super({
      message,
      name: "HttpServiceUnavailable",
      statusCode: httpStatusCodes.SERVICE_UNAVAILABLE,
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