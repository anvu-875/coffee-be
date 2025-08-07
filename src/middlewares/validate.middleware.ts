import z, { type ZodObject, flattenError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { IncomingHttpHeaders } from 'http';
import HttpError from '@/utils/http-error';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME
} from '@/services/auth.service';

export const validateBody =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = flattenError(result.error);
      return next(
        new HttpError('Invalid request body', 400, error.fieldErrors)
      );
    }
    req.body = result.data;
    next();
  };

export const validateQuery =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const error = flattenError(result.error);
      return next(
        new HttpError('Invalid query parameters', 400, error.fieldErrors)
      );
    }
    req.query = result.data as ParsedQs;
    next();
  };

export const validateParams =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const error = flattenError(result.error);
      return next(
        new HttpError('Invalid route parameters', 400, error.fieldErrors)
      );
    }
    req.params = result.data as ParamsDictionary;
    next();
  };

export const validateHeaders =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.headers);
    if (!result.success) {
      const error = flattenError(result.error);
      return next(new HttpError('Invalid headers', 400, error.fieldErrors));
    }
    req.headers = { ...req.headers, ...result.data } as IncomingHttpHeaders;
    next();
  };

export const validateCookies =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.cookies);
    if (!result.success) {
      const error = flattenError(result.error);
      return next(new HttpError('Invalid cookies', 400, error.fieldErrors));
    }
    req.cookies = { ...req.cookies, ...result.data };
    next();
  };

const authsTokenSchema = z.object({
  [ACCESS_TOKEN_COOKIE_NAME]: z.string('Access token is required'),
  [REFRESH_TOKEN_COOKIE_NAME]: z.string('Refresh token is required')
});
export const validateAuthCookies = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const result = authsTokenSchema.safeParse(req.cookies);
  if (!result.success) {
    const error = flattenError(result.error);
    const resError: { accessToken?: string[]; refreshToken?: string[] } = {};
    if (error.fieldErrors[ACCESS_TOKEN_COOKIE_NAME]) {
      resError.accessToken = error.fieldErrors[ACCESS_TOKEN_COOKIE_NAME];
    }
    if (error.fieldErrors[REFRESH_TOKEN_COOKIE_NAME]) {
      resError.refreshToken = error.fieldErrors[REFRESH_TOKEN_COOKIE_NAME];
    }
    if (
      error.fieldErrors[ACCESS_TOKEN_COOKIE_NAME] ||
      error.fieldErrors[REFRESH_TOKEN_COOKIE_NAME]
    ) {
      return next(new HttpError('Invalid auth cookies', 400, resError));
    }
  }
  req.cookies = { ...req.cookies, ...result.data };
  next();
};

export const refreshCookieSchema = z.object({
  [REFRESH_TOKEN_COOKIE_NAME]: z.string('Refresh token is required')
});
export const validateRefreshCookies = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const result = refreshCookieSchema.safeParse(req.cookies);
  if (!result.success) {
    const error = flattenError(result.error);
    const resError: { refreshToken?: string[] } = {};
    if (error.fieldErrors[REFRESH_TOKEN_COOKIE_NAME]) {
      resError.refreshToken = error.fieldErrors[REFRESH_TOKEN_COOKIE_NAME];
    }
    return next(new HttpError('Invalid refresh cookies', 400, resError));
  }
  req.cookies = { ...req.cookies, ...result.data };
  next();
};
