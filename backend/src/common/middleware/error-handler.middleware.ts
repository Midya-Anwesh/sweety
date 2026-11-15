import type { ErrorRequestHandler } from 'express';
import { HttpError } from 'routing-controllers';
import type { ValidationError } from 'class-validator';
import { logger } from '../logger';

function validationMessages(errors: ValidationError[]): { field: string; message: string }[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}).map((message) => ({ field: error.property, message })),
    ...validationMessages(error.children ?? []),
  ]);
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  const candidate = error as { status?: number; type?: string; errors?: ValidationError[] };
  const status = error instanceof HttpError ? error.httpCode
    : candidate.type === 'entity.parse.failed' ? 400
    : candidate.type === 'entity.too.large' ? 413 : 500;
  const details = Array.isArray(candidate.errors) ? validationMessages(candidate.errors) : [];
  let message = status >= 500 ? 'Something went wrong. Please try again.'
    : status === 413 ? 'Request body is too large.'
    : candidate.type === 'entity.parse.failed' ? 'Request body must contain valid JSON.'
    : error instanceof Error ? error.message : 'Request failed.';
  if (details.length) message = details[0].message;
  if (status >= 500) logger.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Request failed');
  response.status(status).json({ message, ...(details.length ? { errors: details } : {}) });
};
