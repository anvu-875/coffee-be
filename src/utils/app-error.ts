class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    // calling the parent constructor
    super(message);

    this.statusCode = statusCode;
    // 400 for fail, 500 for error
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // this is for operational errors, which are predictable
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
