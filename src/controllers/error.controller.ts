import type { Request, Response, NextFunction } from 'express';
import HttpError from '@/utils/http-error';
import { Prisma } from '@prisma/client';
import env from '@/utils/env';
import { AuthError } from '@/services/auth.service';
import { StatusCodes } from '@/utils/http-enum';

/**
 * Convert Prisma P2002 error to HttpError with detail for multiple fields
 */
function handlePrismaKnownError(
  err: Prisma.PrismaClientKnownRequestError
): HttpError {
  if (err.code === 'P2002') {
    const targets = err.meta?.target as string | string[] | undefined;
    let errors: Record<string, string[]> = {};

    if (Array.isArray(targets)) {
      targets.forEach((field) => {
        errors[String(field)] = ['Duplicate value'];
      });
    } else if (typeof targets === 'string') {
      errors[String(targets)] = ['Duplicate value'];
    } else {
      errors = { unknown: ['Duplicate value'] };
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

  // Default prisma client known error -> treat as bad request
  return new HttpError(err.message, StatusCodes.BAD_REQUEST);
}

/**
 * Map AuthError.code to HttpError and optionally set WWW-Authenticate header
 */
function mapAuthErrorToHttp(err: AuthError): HttpError {
  switch (err.code) {
    case 'INVALID_PAYLOAD':
      return new HttpError(err.message, StatusCodes.BAD_REQUEST);

    case 'INVALID_TOKEN_TYPE':
    case 'INVALID_SIGNATURE':
    case 'PUBLIC_KEY_NOT_FOUND':
      return new HttpError(
        err.message || 'Unauthorized',
        StatusCodes.UNAUTHORIZED
      );

    case 'TOKEN_EXPIRED':
      return new HttpError(
        err.message || 'Token expired',
        StatusCodes.UNAUTHORIZED
      );

    case 'VERIFY_ERROR':
      return new HttpError(
        err.message || 'Token verification failed',
        StatusCodes.INTERNAL_SERVER_ERROR
      );

    default:
      return new HttpError(
        err.message || 'Unauthorized',
        StatusCodes.UNAUTHORIZED
      );
  }
}

/**
 * Global error handler
 */
const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let httpError: HttpError;

  // Prisma specific errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    httpError = handlePrismaKnownError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    httpError = new HttpError(
      '(Prisma) Invalid query or input data.',
      StatusCodes.BAD_REQUEST
    );
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    httpError = new HttpError(
      '(Prisma) Database connection failed.',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
  // Auth errors (from authService)
  else if (err instanceof AuthError) {
    httpError = mapAuthErrorToHttp(err);
  }
  // Custom HttpError thrown in app logic
  else if (err instanceof HttpError) {
    httpError = err;
  }
  // Generic Error
  else if (err instanceof Error) {
    // Log with stack in dev for debugging
    if (env.NODE_ENV === 'development') {
      console.error('Unhandled error:', err);
      httpError = new HttpError(
        err.message || 'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    } else {
      // avoid leaking details in production
      console.error('Unhandled error:', err);
      httpError = new HttpError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  // Unknown thrown value
  else {
    httpError = new HttpError(
      'Internal Server Error',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  // Respond with normalized JSON from HttpError
  return res.status(httpError.statusCode).json(httpError.toJSON());
};

export default errorHandler;
