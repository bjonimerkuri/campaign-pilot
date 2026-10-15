import { randomUUID } from 'node:crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../lib/config';
import { db } from '../lib/dynamo';
import { publishCampaignCreated } from '../lib/events';
import { handle, json, parseJson, requireTenant } from '../lib/http';
import { campaignSk, tenantPk } from '../lib/keys';
import { type CampaignRecord, createCampaignSchema, toPublic } from '../lib/schemas';

export const handler = handle(async (event) => {
  const tenantId = requireTenant(event);
  const input = createCampaignSchema.parse(parseJson(event));

  const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const record: CampaignRecord = {
    pk: tenantPk(tenantId),
    sk: campaignSk(id),
    id,
    ...input,
    status: 'PENDING',
    variants: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.send(
    new PutCommand({
      TableName: config.table(),
      Item: record,
      ConditionExpression: 'attribute_not_exists(pk)',
    }),
  );
  await publishCampaignCreated(tenantId, id);

  return json(202, toPublic(record));
});
