import { Request, Response, NextFunction } from 'express';
import AppError from '@/utils/app-error';

const devError = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    // stack: err.stack
  });
};

const prodError = (err: AppError, res: Response) => {
  // operational errors are trusted, so we send a message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // programming or other unknown errors: don't leak error details
  } else {
    // 1) log the error
    console.error('ERROR 💥', err);

    // 2) send a generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong! (this is a non-operational error)',
    });
  }
};

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  // 400 for bad request
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value!`;
  // 400 for bad request
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
  const validationErrors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${validationErrors.join('. ')}`;
  // 400 for bad request
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again!', 401);

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  (err.statusCode as number) = err.statusCode || 500;
  (err.status as string) = err.status || 'error';

  // in development, we want to send the error stack
  if (process.env.NODE_ENV === 'development') {
    devError(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // hard copy of the error object
    let error: AppError = { ...err };
    // the condition must be err.name, not error.name
    // because the copy of err does not contain the name property
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (err.message.startsWith('E11000')) {
      error = handleDuplicateFieldsDB(error);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    prodError(error, res);
  }
  next();
};

export default errorHandler;
