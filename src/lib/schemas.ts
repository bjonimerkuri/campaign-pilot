import { z } from 'zod';

export const toneValues = ['professional', 'playful', 'urgent', 'friendly'] as const;
export type Tone = (typeof toneValues)[number];

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  product: z.string().trim().min(1).max(200),
  audience: z.string().trim().min(1).max(200),
  tone: z.enum(toneValues).default('professional'),
  variantCount: z.number().int().min(1).max(5).default(3),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export interface CopyVariant {
  headline: string;
  body: string;
  cta: string;
}

export type CampaignStatus = 'PENDING' | 'READY' | 'FAILED';

export interface CampaignRecord {
  pk: string;
  sk: string;
  id: string;
  name: string;
  product: string;
  audience: string;
  tone: Tone;
  variantCount: number;
  status: CampaignStatus;
  variants: CopyVariant[];
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export const toPublic = ({ pk, sk, ...rest }: CampaignRecord): Omit<CampaignRecord, 'pk' | 'sk'> => rest;
