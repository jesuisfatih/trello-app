import { z } from 'zod';

export const shopifyWebhookSchema = z.object({
  topic: z.string(),
  domain: z.string(),
  shop_id: z.number().optional(),
});

export const trelloWebhookSchema = z.object({
  action: z.object({
    type: z.string(),
    data: z.any(),
    date: z.string(),
    memberCreator: z.any(),
  }),
  model: z.object({
    id: z.string(),
    name: z.string().optional(),
  }),
});

export const createCardSchema = z.object({
  name: z.string().min(1),
  idList: z.string(),
  desc: z.string().optional(),
  pos: z.string().optional(),
  due: z.string().optional(),
  idMembers: z.array(z.string()).optional(),
  idLabels: z.array(z.string()).optional(),
});

export const updateCardSchema = z.object({
  name: z.string().optional(),
  desc: z.string().optional(),
  closed: z.boolean().optional(),
  idList: z.string().optional(),
  pos: z.string().optional(),
  due: z.string().optional(),
});

export const addCommentSchema = z.object({
  text: z.string().min(1),
});

export const createWebhookSchema = z.object({
  description: z.string(),
  idModel: z.string(),
});

