import type { Request, Response, NextFunction } from 'express';
import HttpError from '@/utils/http-error';
import { Prisma } from '@prisma/client';

/**
 * Convert Prisma P2002 error to HttpError with detail for multiple fields
 */
function handlePrismaKnownError(
  err: Prisma.PrismaClientKnownRequestError
): HttpError {
  if (err.code === 'P2002') {
    // target may be array of fields or single string
    const targets = err.meta?.target as string | string[];
    let errors: Record<string, string[]> = {};

    if (Array.isArray(targets)) {
      targets.forEach((field) => {
        errors[String(field)] = ['Duplicate value'];
      });
    } else if (typeof targets === 'string') {
      errors[String(targets)] = ['Duplicate value'];
    } else {
      // fallback
      errors = { unknown: ['Duplicate value'] };
    }

    return new HttpError(
      `Duplicate value on field(s): ${Object.keys(errors).join(', ')}`,
      409,
      errors
    );
  }

  if (err.code === 'P2025') {
    return new HttpError('Resource not found.', 404);
  }

  // default fallback
  return new HttpError(err.message, 400);
}

/**
 * Error handling middleware
 */
const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Convert Prisma errors if not in development
  if (process.env.NODE_ENV !== 'development') {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      err = handlePrismaKnownError(err);
    } else if (err instanceof Prisma.PrismaClientValidationError) {
      err = new HttpError('Invalid query or input data.', 400);
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
      err = new HttpError('Database connection failed.', 500);
    }
  }

  res.status(err.statusCode).json(err.toJSON());

  next();
};

export default errorHandler;
