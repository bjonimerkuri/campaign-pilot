import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../src/lib/dynamo', () => ({ db: { send: vi.fn() } }));
vi.mock('../src/lib/openai', () => ({ generateVariants: vi.fn() }));

import { handler } from '../src/handlers/generateCopy';
import { db } from '../src/lib/dynamo';
import { generateVariants } from '../src/lib/openai';

const send = db.send as unknown as Mock;
const generate = generateVariants as unknown as Mock;

const event = { detail: { tenantId: 'tenant-a', campaignId: '1-abc' } };

const pendingCampaign = {
  pk: 'TENANT#tenant-a',
  sk: 'CAMPAIGN#1-abc',
  id: '1-abc',
  product: 'Running shoes',
  audience: 'Weekend runners',
  tone: 'playful',
  variantCount: 2,
  status: 'PENDING',
};

const variants = [
  { headline: 'Run further', body: 'Light, fast, comfortable.', cta: 'Shop now' },
  { headline: 'Your Sunday, upgraded', body: 'Built for long runs.', cta: 'Get yours' },
];

describe('generateCopy', () => {
  beforeEach(() => {
    vi.stubEnv('TABLE_NAME', 'test-table');
    send.mockReset();
    generate.mockReset();
  });

  it('ignores events for campaigns that are not pending', async () => {
    send.mockResolvedValueOnce({ Item: { ...pendingCampaign, status: 'READY' } });

    await handler(event);

    expect(generate).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('ignores events for unknown campaigns', async () => {
    send.mockResolvedValueOnce({});

    await handler(event);

    expect(generate).not.toHaveBeenCalled();
  });

  it('stores generated variants and marks the campaign ready', async () => {
    send.mockResolvedValueOnce({ Item: pendingCampaign }).mockResolvedValueOnce({});
    generate.mockResolvedValueOnce(variants);

    await handler(event);

    const update = send.mock.calls[1][0].input;
    expect(update.Key).toEqual({ pk: 'TENANT#tenant-a', sk: 'CAMPAIGN#1-abc' });
    expect(update.ExpressionAttributeValues[':s']).toBe('READY');
    expect(update.ExpressionAttributeValues[':v']).toEqual(variants);
    expect(update.ConditionExpression).toBe('#s = :pending');
  });

  it('marks the campaign failed when the model call fails', async () => {
    send.mockResolvedValueOnce({ Item: pendingCampaign }).mockResolvedValueOnce({});
    generate.mockRejectedValueOnce(new Error('rate limited'));

    await handler(event);

    const update = send.mock.calls[1][0].input;
    expect(update.ExpressionAttributeValues[':s']).toBe('FAILED');
    expect(update.ExpressionAttributeValues[':e']).toBe('rate limited');
  });

  it('rejects malformed events', async () => {
    await expect(handler({ detail: { tenantId: '' } })).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
});
