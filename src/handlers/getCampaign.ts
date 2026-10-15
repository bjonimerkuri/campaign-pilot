import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../lib/config';
import { db } from '../lib/dynamo';
import { HttpError, handle, json, requireTenant } from '../lib/http';
import { campaignSk, tenantPk } from '../lib/keys';
import { type CampaignRecord, toPublic } from '../lib/schemas';

export const handler = handle(async (event) => {
  const tenantId = requireTenant(event);
  const id = event.pathParameters?.id;
  if (!id) {
    throw new HttpError(400, 'missing_id');
  }

  const result = await db.send(
    new GetCommand({
      TableName: config.table(),
      Key: { pk: tenantPk(tenantId), sk: campaignSk(id) },
    }),
  );
  if (!result.Item) {
    throw new HttpError(404, 'not_found');
  }
  return json(200, toPublic(result.Item as CampaignRecord));
});
