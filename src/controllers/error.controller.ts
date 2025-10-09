import type { Request, Response, NextFunction } from 'express';
import HttpError from '@/utils/http-error';
import { Prisma } from '@prisma/client';
import env from '@/utils/env';
import { AuthError } from '@/services/auth.service';
import { StatusCodes } from '@/utils/http-enum';

/** Prisma error handling */
function handlePrismaKnownError(
  err: Prisma.PrismaClientKnownRequestError
): HttpError {
  if (err.code === 'P2002') {
    const targets = err.meta?.target as string | string[] | undefined;
    const errors: Record<string, string[]> = {};

    if (Array.isArray(targets)) {
      for (const field of targets) errors[field] = ['Duplicate value'];
    } else if (typeof targets === 'string') {
      errors[targets] = ['Duplicate value'];
    } else {
      errors.unknown = ['Duplicate value'];
    }

    return new HttpError(
      `(Prisma) Duplicate value on field(s): ${Object.keys(errors).join(', ')}`,
      StatusCodes.CONFLICT,
      errors
    );
  }

  if (err.code === 'P2025') {
    return new HttpError('(Prisma) Resource not found.', StatusCodes.NOT_FOUND);
  }

  return new HttpError(err.message, StatusCodes.BAD_REQUEST);
}

/** AuthError mapping + RFC 6750 headers */
function mapAuthErrorToHttp(err: AuthError, res: Response): HttpError {
  let wwwAuthHeader = `Bearer realm="api"`;
  let httpError: HttpError;

  switch (err.code) {
    case 'INVALID_PAYLOAD':
      wwwAuthHeader += `, error="invalid_token", error_description="${err.message}"`;
      httpError = new HttpError(err.message, StatusCodes.BAD_REQUEST);
      break;

    case 'INVALID_TOKEN_TYPE':
    case 'INVALID_SIGNATURE':
    case 'PUBLIC_KEY_NOT_FOUND':
    case 'TOKEN_EXPIRED':
    case 'SESSION_USER_MISMATCH':
    case 'REFRESH_REUSE_DETECTED':
      wwwAuthHeader += `, error="invalid_token", error_description="${err.message}"`;
      httpError = new HttpError(err.message, StatusCodes.UNAUTHORIZED);
      break;

    case 'VERIFY_ERROR':
      wwwAuthHeader += `, error="server_error"`;
      httpError = new HttpError(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
      break;

    default:
      wwwAuthHeader += `, error="invalid_token"`;
      httpError = new HttpError(
        err.message || 'Unauthorized',
        StatusCodes.UNAUTHORIZED
      );
  }

  res.setHeader('WWW-Authenticate', wwwAuthHeader);
  return httpError;
}

/** Global error handler */
const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle invalid JSON body from express.json()
  if (
    err instanceof SyntaxError &&
    'body' in err &&
    (err as unknown as { type: string }).type === 'entity.parse.failed'
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 400,
      statusText: 'Bad Request',
      msg: 'Invalid JSON format in request body'
    });
  }

  let httpError: HttpError;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    httpError = handlePrismaKnownError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    httpError = new HttpError(
      'Invalid query or input data.',
      StatusCodes.BAD_REQUEST
    );
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    httpError = new HttpError(
      'Database connection failed.',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  } else if (err instanceof AuthError) {
    httpError = mapAuthErrorToHttp(err, res);
  } else if (err instanceof HttpError) {
    httpError = err;
    if (httpError.statusCode === StatusCodes.UNAUTHORIZED) {
      res.setHeader(
        'WWW-Authenticate',
        `Bearer realm="api", error="invalid_token", error_description="${httpError.message}"`
      );
    }
  } else if (err instanceof Error) {
    console.error('Unhandled error:', err);
    httpError = new HttpError(
      env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  } else {
    httpError = new HttpError(
      'Internal Server Error',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  return res.status(httpError.statusCode).json(httpError.toJSON());
};

export default errorHandler;
