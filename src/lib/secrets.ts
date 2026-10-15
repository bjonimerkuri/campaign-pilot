import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { config } from './config';

const client = new SSMClient({});
let cached: string | undefined;

export const getOpenAiKey = async (): Promise<string> => {
  if (cached) {
    return cached;
  }
  const result = await client.send(
    new GetParameterCommand({ Name: config.openAiKeyParam(), WithDecryption: true }),
  );
  const value = result.Parameter?.Value;
  if (!value) {
    throw new Error('OpenAI API key parameter is empty');
  }
  cached = value;
  return value;
};
