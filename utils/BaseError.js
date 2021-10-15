const { errorCodes } = require('../enums');

class BaseError extends Error {
  constructor(
    message,
    statusCode = 500,
    errorCode = errorCodes.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

module.exports = BaseError;
