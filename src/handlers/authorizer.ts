import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../lib/config';
import { db } from '../lib/dynamo';
import { apiKeyPk, hashApiKey, TENANT_SK } from '../lib/keys';

interface AuthorizerEvent {
  headers?: Record<string, string | undefined>;
}

interface AuthorizerResult {
  isAuthorized: boolean;
  context?: { tenantId: string };
}

export const handler = async (event: AuthorizerEvent): Promise<AuthorizerResult> => {
  const apiKey = event.headers?.['x-api-key'];
  if (!apiKey) {
    return { isAuthorized: false };
  }

  const result = await db.send(
    new GetCommand({
      TableName: config.table(),
      Key: { pk: apiKeyPk(hashApiKey(apiKey)), sk: TENANT_SK },
    }),
  );

  const tenantId = result.Item?.tenantId;
  if (typeof tenantId !== 'string') {
    return { isAuthorized: false };
  }
  return { isAuthorized: true, context: { tenantId } };
};
