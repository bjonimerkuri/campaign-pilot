import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../src/lib/dynamo', () => ({ db: { send: vi.fn() } }));

import { handler } from '../src/handlers/listCampaigns';
import { db } from '../src/lib/dynamo';

const send = db.send as unknown as Mock;

const buildEvent = (tenantId: string | undefined) => ({
  requestContext: { authorizer: tenantId ? { lambda: { tenantId } } : undefined },
});

describe('listCampaigns', () => {
  beforeEach(() => {
    vi.stubEnv('TABLE_NAME', 'test-table');
    send.mockReset();
  });

  it('requires a tenant', async () => {
    const result = await handler(buildEvent(undefined));
    expect(result.statusCode).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it('queries only the tenant partition, newest first', async () => {
    send.mockResolvedValue({ Items: [] });

    await handler(buildEvent('tenant-a'));

    const input = send.mock.calls[0][0].input;
    expect(input.ExpressionAttributeValues[':pk']).toBe('TENANT#tenant-a');
    expect(input.ExpressionAttributeValues[':prefix']).toBe('CAMPAIGN#');
    expect(input.ScanIndexForward).toBe(false);
  });

  it('returns campaigns without internal keys', async () => {
    send.mockResolvedValue({
      Items: [{ pk: 'TENANT#tenant-a', sk: 'CAMPAIGN#2-b', id: '2-b', status: 'PENDING' }],
    });

    const result = await handler(buildEvent('tenant-a'));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].pk).toBeUndefined();
    expect(body.items[0].id).toBe('2-b');
  });

  it('returns an empty list when the tenant has no campaigns', async () => {
    send.mockResolvedValue({});

    const result = await handler(buildEvent('tenant-a'));

    expect(JSON.parse(result.body)).toEqual({ items: [] });
  });
});
