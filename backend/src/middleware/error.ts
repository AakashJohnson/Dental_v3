import { NextFunction, Request, Response } from 'express';

export interface HttpError extends Error {
  status?: number;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const status = err.status ?? 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ error: err.message ?? 'Internal server error' });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

/** Wrap async route handlers so rejected promises reach the error handler. */
export function asyncH(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
