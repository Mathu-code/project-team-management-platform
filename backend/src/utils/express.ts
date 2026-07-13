import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../utils/httpError.js';

/**
 * Wraps an async route handler so thrown errors are forwarded to Express error middleware.
 */
export function asyncHandler<
  T extends Request = Request,
  U extends Response = Response,
>(
  fn: (req: T, res: U, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validates req.body / req.query / req.params against a Zod schema and replaces
 * the validated value on the request.
 */
export function validate<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(
        badRequest(
          'Validation failed',
          result.error.flatten().fieldErrors,
        ),
      );
      return;
    }
    (req as any)[source] = result.data;
    next();
  };
}
