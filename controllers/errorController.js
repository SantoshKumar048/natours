const AppError = require('../utils/appError');

const handleDuplicateFieldsDB = (err) => {
  //console.log(err.errmsg);
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  console.log(err.errors);
  const error = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input Data. ${error.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = (err) =>
  new AppError('Invalid JWT Token, Please login again', 401);
const handleJWTExpiredError = (err) => {
  return new AppError('JWT Token has been expired, Please login again', 401);
};
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api'))
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  console.log(err.errmsg);

  // B) RENDER WEBSITES
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      console.log(err);
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //1) Log Error
    console.log('Error :', err);

    //2) Send generic messages
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
  // B) RENDERD WEBSITES
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  //1) Log Error
  console.log('Error :', err);

  //2) Send generic messages
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again',
  });
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.name = err.name;
    error.message = err.message;
    error.code = err.code;

    // console.log('in Error controller');
    // console.log(err.name);
    // console.log(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res);
  }
};
