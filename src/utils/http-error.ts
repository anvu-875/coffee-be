import env from './env';
import { ClientError, ServerError, httpStatusTextByCode } from './http-enum';

/**
 * Allowed error HTTP status codes (400–599)
 * Automatically inferred from StatusCodes enum
 */
const ALLOWED_ERROR_CODES = [
  ...Object.values(ClientError).filter((code): code is number => typeof code === 'number'),
  ...Object.values(ServerError).filter((code): code is number => typeof code === 'number'),
];

/**
 * A flexible type to represent detailed error info
 */
type ErrorDetail = Record<string | number | symbol, unknown> | Array<unknown> | string | number | null;

/**
 * A type to force status to be 4xx or 5xx
 */
type ErrorStatusCode = ClientError | ServerError;

/**
 * Unified HTTP error class with status validation and metadata
 */
class HttpError extends Error {
  public statusCode: ErrorStatusCode;
  public reasonPhrase: string;
  public errorDetail: ErrorDetail;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: ErrorStatusCode,
    errorDetail: ErrorDetail = null,
    isOperational: boolean = true
  ) {
    // check validation of status code
    if (!ALLOWED_ERROR_CODES.includes(statusCode)) {
      console.log(
        `${'\x1b[1m'}${'\x1b[31m'}⚠️  Invalid status code ${statusCode}. Must be a 4xx or 5xx HTTP status code and must be existed.${'\x1b[0m'}`
      );
    }

    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.reasonPhrase = httpStatusTextByCode(statusCode);
    this.errorDetail = errorDetail;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Standard error JSON shape for API responses based on environment
   */
  toJSON() {
    if (env.NODE_ENV === 'development') {
      return {
        status: this.statusCode,
        statusText: this.reasonPhrase,
        msg: this.message,
        error: this.errorDetail,
        stack: this.stack,
        isOperational: this.isOperational,
      };
    } else {
      // production
      return {
        status: this.statusCode,
        msg: this.message,
      };
    }
  }
}

export default HttpError;
