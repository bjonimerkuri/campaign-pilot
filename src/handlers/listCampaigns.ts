import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../lib/config';
import { db } from '../lib/dynamo';
import { handle, json, requireTenant } from '../lib/http';
import { CAMPAIGN_PREFIX, tenantPk } from '../lib/keys';
import { type CampaignRecord, toPublic } from '../lib/schemas';

export const handler = handle(async (event) => {
  const tenantId = requireTenant(event);

  const result = await db.send(
    new QueryCommand({
      TableName: config.table(),
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': tenantPk(tenantId), ':prefix': CAMPAIGN_PREFIX },
      ScanIndexForward: false,
      Limit: 50,
    }),
  );

  const items = (result.Items ?? []) as CampaignRecord[];
  return json(200, { items: items.map(toPublic) });
});
