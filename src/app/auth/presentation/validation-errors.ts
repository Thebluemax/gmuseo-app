import { HttpErrorResponse } from '@angular/common/http';
import { ValidationError } from '../domain/auth.model';

/** Per-field validation errors from a 422 response (empty if not a 422). */
export function fieldErrors(err: unknown): Record<string, string[]> {
  if (err instanceof HttpErrorResponse && err.status === 422) {
    return (err.error as ValidationError | undefined)?.errors ?? {};
  }
  return {};
}

/** First human-readable message from a 422, else null. */
export function firstError(err: unknown): string | null {
  if (err instanceof HttpErrorResponse && err.status === 422) {
    const body = err.error as ValidationError | undefined;
    return body?.message ?? Object.values(body?.errors ?? {})[0]?.[0] ?? null;
  }
  return null;
}
