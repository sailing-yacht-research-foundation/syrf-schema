const BaseError = require('./BaseError');
class ServiceError extends BaseError {
  constructor(message, statusCode = 500, errorCode) {
    super(message, statusCode, errorCode);
  }
}

module.exports = ServiceError;
