import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../src/lib/dynamo', () => ({ db: { send: vi.fn() } }));

import { handler } from '../src/handlers/getCampaign';
import { db } from '../src/lib/dynamo';

const send = db.send as unknown as Mock;

const buildEvent = (id: string | undefined, tenantId: string | undefined) => ({
  pathParameters: id ? { id } : undefined,
  requestContext: { authorizer: tenantId ? { lambda: { tenantId } } : undefined },
});

describe('getCampaign', () => {
  beforeEach(() => {
    vi.stubEnv('TABLE_NAME', 'test-table');
    send.mockReset();
  });

  it('requires a tenant', async () => {
    const result = await handler(buildEvent('1-abc', undefined));
    expect(result.statusCode).toBe(401);
  });

  it('only reads from the partition of the authenticated tenant', async () => {
    send.mockResolvedValue({});

    const result = await handler(buildEvent('1-abc', 'tenant-b'));

    expect(result.statusCode).toBe(404);
    const command = send.mock.calls[0][0];
    expect(command.input.Key).toEqual({ pk: 'TENANT#tenant-b', sk: 'CAMPAIGN#1-abc' });
  });

  it('does not leak internal errors', async () => {
    send.mockRejectedValue(new Error('dynamodb exploded'));

    const result = await handler(buildEvent('1-abc', 'tenant-a'));

    expect(result.statusCode).toBe(500);
    expect(result.body).not.toContain('exploded');
  });

  it('returns the campaign without internal keys', async () => {
    send.mockResolvedValue({
      Item: { pk: 'TENANT#tenant-a', sk: 'CAMPAIGN#1-abc', id: '1-abc', status: 'READY', variants: [] },
    });

    const result = await handler(buildEvent('1-abc', 'tenant-a'));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.id).toBe('1-abc');
    expect(body.pk).toBeUndefined();
    expect(body.sk).toBeUndefined();
  });
});
