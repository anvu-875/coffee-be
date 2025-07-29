import { ZodObject, treeifyError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const tree = treeifyError(result.error);
    return res.status(400).json({
      message: 'Validation failed',
      errors: tree,
    });
  }
  req.body = result.data;
  next();
};
