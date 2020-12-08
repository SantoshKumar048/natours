class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
    this.isOperational = true;
    console.log(this);
    // console.log(`This is this in AppError:   ${this}`);
    // console.log(`This is this.constructor in AppError :  ${this.constructor}`);
    Error.captureStackTrace(this, this.constructor);
    console.log('in AppError');
  }
}

module.exports = AppError;
