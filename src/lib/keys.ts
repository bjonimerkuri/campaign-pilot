import { createHash } from 'node:crypto';

export const CAMPAIGN_PREFIX = 'CAMPAIGN#';
export const TENANT_SK = 'TENANT';

export const tenantPk = (tenantId: string): string => `TENANT#${tenantId}`;
export const campaignSk = (campaignId: string): string => `${CAMPAIGN_PREFIX}${campaignId}`;
export const apiKeyPk = (hash: string): string => `APIKEY#${hash}`;
export const hashApiKey = (apiKey: string): string => createHash('sha256').update(apiKey).digest('hex');
