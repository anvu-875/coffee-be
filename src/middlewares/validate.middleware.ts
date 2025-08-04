import { type ZodObject, treeifyError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { IncomingHttpHeaders } from 'http';
import HttpError from '@/utils/http-error';

export const validateBody =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const tree = treeifyError(result.error);
      return next(new HttpError('Invalid request body', 400, tree));
    }
    req.body = result.data;
    next();
  };

export const validateQuery =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const tree = treeifyError(result.error);
      return next(new HttpError('Invalid query parameters', 400, tree));
    }
    req.query = result.data as ParsedQs;
    next();
  };

export const validateParams =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const tree = treeifyError(result.error);
      return next(new HttpError('Invalid route parameters', 400, tree));
    }
    req.params = result.data as ParamsDictionary;
    next();
  };

export const validateHeaders =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.headers);
    if (!result.success) {
      const tree = treeifyError(result.error);
      return next(new HttpError('Invalid headers', 400, tree));
    }
    req.headers = result.data as IncomingHttpHeaders;
    next();
  };
