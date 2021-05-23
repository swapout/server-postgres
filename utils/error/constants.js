httpStatusCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 501
}

errorTypes = {
  POSTGRES_ERROR: 'Postgres error',
  SERVER_ERROR: 'Server error',
  VALIDATION_ERROR: 'Validation error',
  AUTHENTICATION_ERROR: 'Authentication error',
  OTHER_ERROR: 'Other error'
}

postgresErrorCodes = [
  '01', '02', '03', '08', '09', '0A', '0B', '0F', '0L', '0P', '0Z', '20', '21', '22', '23', '24', '25', '26', '27', '28', '2B', '2D', '2F', '34', '38', '39', '3B', '3D', '3F', '40', '42', '44', '53', '54', '55', '57', '58', '72', 'F0', 'HV', 'P0', 'XX'
]

module.exports = {
  httpStatusCodes,
  postgresErrorCodes,
  errorTypes
}