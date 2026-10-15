import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../src/lib/dynamo', () => ({ db: { send: vi.fn() } }));

import { handler } from '../src/handlers/authorizer';
import { db } from '../src/lib/dynamo';
import { apiKeyPk, hashApiKey } from '../src/lib/keys';

const send = db.send as unknown as Mock;

describe('authorizer', () => {
  beforeEach(() => {
    vi.stubEnv('TABLE_NAME', 'test-table');
    send.mockReset();
  });

  it('denies requests without an api key', async () => {
    const result = await handler({ headers: {} });
    expect(result).toEqual({ isAuthorized: false });
    expect(send).not.toHaveBeenCalled();
  });

  it('denies unknown api keys', async () => {
    send.mockResolvedValue({});
    const result = await handler({ headers: { 'x-api-key': 'unknown' } });
    expect(result).toEqual({ isAuthorized: false });
  });

  it('looks keys up by hash and returns the tenant context', async () => {
    send.mockResolvedValue({ Item: { tenantId: 'tenant-a' } });

    const result = await handler({ headers: { 'x-api-key': 'valid-key' } });

    expect(result).toEqual({ isAuthorized: true, context: { tenantId: 'tenant-a' } });
    const key = send.mock.calls[0][0].input.Key;
    expect(key).toEqual({ pk: apiKeyPk(hashApiKey('valid-key')), sk: 'TENANT' });
    expect(JSON.stringify(key)).not.toContain('valid-key');
  });
});
