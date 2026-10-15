const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
};

export const config = {
  table: (): string => required('TABLE_NAME'),
  busName: (): string => required('EVENT_BUS_NAME'),
  openAiKeyParam: (): string => required('OPENAI_KEY_PARAM'),
  openAiModel: (): string => process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
};
