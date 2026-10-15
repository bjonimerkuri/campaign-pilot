import { createHash, randomBytes } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const [table, tenantId, name] = process.argv.slice(2);

if (!table || !tenantId || !name) {
  console.error('Usage: npm run seed -- <table-name> <tenant-id> <tenant-name>');
  process.exit(1);
}

const apiKey = randomBytes(24).toString('hex');
const hash = createHash('sha256').update(apiKey).digest('hex');
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

await client.send(
  new PutCommand({
    TableName: table,
    Item: { pk: `APIKEY#${hash}`, sk: 'TENANT', tenantId, name },
  }),
);

console.log(`Tenant "${tenantId}" created.`);
console.log(`API key (shown once): ${apiKey}`);
