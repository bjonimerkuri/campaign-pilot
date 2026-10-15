import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { config } from '../lib/config';
import { db } from '../lib/dynamo';
import { campaignSk, tenantPk } from '../lib/keys';
import { log } from '../lib/logger';
import { generateVariants } from '../lib/openai';
import type { CampaignRecord, CopyVariant } from '../lib/schemas';

const detailSchema = z.object({
  tenantId: z.string().min(1),
  campaignId: z.string().min(1),
});

interface CampaignCreatedEvent {
  detail: unknown;
}

interface CampaignKey {
  pk: string;
  sk: string;
}

const markFailed = async (key: CampaignKey, error: unknown): Promise<void> => {
  const message = error instanceof Error ? error.message : 'unknown_error';
  await db.send(
    new UpdateCommand({
      TableName: config.table(),
      Key: key,
      UpdateExpression: 'SET #s = :s, errorMessage = :e, updatedAt = :u',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': 'FAILED',
        ':e': message.slice(0, 300),
        ':u': new Date().toISOString(),
      },
    }),
  );
};

export const handler = async (event: CampaignCreatedEvent): Promise<void> => {
  const { tenantId, campaignId } = detailSchema.parse(event.detail);
  const key: CampaignKey = { pk: tenantPk(tenantId), sk: campaignSk(campaignId) };

  const found = await db.send(new GetCommand({ TableName: config.table(), Key: key }));
  const campaign = found.Item as CampaignRecord | undefined;

  if (!campaign || campaign.status !== 'PENDING') {
    log('info', 'campaign_skipped', { tenantId, campaignId });
    return;
  }

  let variants: CopyVariant[];
  try {
    variants = await generateVariants(campaign);
  } catch (error) {
    log('error', 'generation_failed', {
      tenantId,
      campaignId,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    await markFailed(key, error);
    return;
  }

  await db.send(
    new UpdateCommand({
      TableName: config.table(),
      Key: key,
      UpdateExpression: 'SET #s = :s, variants = :v, updatedAt = :u',
      ConditionExpression: '#s = :pending',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': 'READY',
        ':v': variants,
        ':u': new Date().toISOString(),
        ':pending': 'PENDING',
      },
    }),
  );
  log('info', 'campaign_ready', { tenantId, campaignId, variants: variants.length });
};
