import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { config } from './config';

export const EVENT_SOURCE = 'campaign-copilot.campaigns';
export const CAMPAIGN_CREATED = 'CampaignCreated';

const client = new EventBridgeClient({});

export const publishCampaignCreated = async (tenantId: string, campaignId: string): Promise<void> => {
  const result = await client.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.busName(),
          Source: EVENT_SOURCE,
          DetailType: CAMPAIGN_CREATED,
          Detail: JSON.stringify({ tenantId, campaignId }),
        },
      ],
    }),
  );
  if (result.FailedEntryCount) {
    throw new Error('Failed to publish CampaignCreated event');
  }
};
