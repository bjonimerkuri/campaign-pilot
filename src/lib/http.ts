import { ZodError } from 'zod';
import { log } from './logger';

export interface ApiEvent {
  body?: string | null;
  pathParameters?: Record<string, string | undefined>;
  requestContext: { authorizer?: { lambda?: { tenantId?: string } } };
}

export interface ApiResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (statusCode: number, body: unknown): ApiResult => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const requireTenant = (event: ApiEvent): string => {
  const tenantId = event.requestContext.authorizer?.lambda?.tenantId;
  if (!tenantId) {
    throw new HttpError(401, 'unauthorized');
  }
  return tenantId;
};

export const parseJson = (event: ApiEvent): unknown => {
  if (!event.body) {
    return {};
  }
  try {
    return JSON.parse(event.body);
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
};

export const handle =
  (fn: (event: ApiEvent) => Promise<ApiResult>) =>
  async (event: ApiEvent): Promise<ApiResult> => {
    try {
      return await fn(event);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: error.message });
      }
      if (error instanceof ZodError) {
        return json(400, { error: 'validation_failed', details: error.flatten() });
      }
      log('error', 'unhandled_error', { reason: error instanceof Error ? error.message : 'unknown' });
      return json(500, { error: 'internal_error' });
    }
  };
