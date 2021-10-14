const BaseError = require('./BaseError');
class ValidationError extends BaseError {
  constructor(message, data, statusCode = 422, errorCode) {
    super(message, statusCode, errorCode);
    this.data = data;
  }
}

module.exports = ValidationError;
