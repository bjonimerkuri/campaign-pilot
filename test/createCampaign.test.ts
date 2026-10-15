import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../src/lib/dynamo', () => ({ db: { send: vi.fn() } }));
vi.mock('../src/lib/events', () => ({ publishCampaignCreated: vi.fn() }));

import { handler } from '../src/handlers/createCampaign';
import { db } from '../src/lib/dynamo';
import { publishCampaignCreated } from '../src/lib/events';

const send = db.send as unknown as Mock;
const publish = publishCampaignCreated as unknown as Mock;

const buildEvent = (body: unknown, tenantId: string | undefined = 'tenant-a') => ({
  body: JSON.stringify(body),
  requestContext: { authorizer: tenantId ? { lambda: { tenantId } } : undefined },
});

const validBody = {
  name: 'Spring sale',
  product: 'Running shoes',
  audience: 'Weekend runners',
};

describe('createCampaign', () => {
  beforeEach(() => {
    vi.stubEnv('TABLE_NAME', 'test-table');
    send.mockReset();
    publish.mockReset();
  });

  it('rejects requests without a tenant', async () => {
    const result = await handler(buildEvent(validBody, undefined));
    expect(result.statusCode).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects invalid payloads', async () => {
    const result = await handler(buildEvent({ name: '' }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects malformed json', async () => {
    const result = await handler({ body: '{oops', requestContext: { authorizer: { lambda: { tenantId: 'tenant-a' } } } });
    expect(result.statusCode).toBe(400);
  });

  it('stores the campaign in the tenant partition and publishes an event', async () => {
    send.mockResolvedValue({});

    const result = await handler(buildEvent(validBody));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(202);
    expect(body.status).toBe('PENDING');
    expect(body.tone).toBe('professional');
    expect(body.variantCount).toBe(3);
    expect(body.pk).toBeUndefined();

    const command = send.mock.calls[0][0];
    expect(command.input.Item.pk).toBe('TENANT#tenant-a');
    expect(command.input.Item.sk).toBe(`CAMPAIGN#${body.id}`);
    expect(publish).toHaveBeenCalledWith('tenant-a', body.id);
  });
});
