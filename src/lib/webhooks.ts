/**
 * Webhook registration and management utilities
 */

import { createTrelloClient } from './trello';
import prisma from './db';

export async function registerTrelloWebhook(
  shopId: string,
  modelId: string,
  description: string
): Promise<any> {
  const trelloConnection = await prisma.trelloConnection.findUnique({
    where: { shopId },
  });

  if (!trelloConnection) {
    throw new Error('Trello not connected');
  }

  const client = createTrelloClient(trelloConnection.token);
  const callbackUrl = `${process.env.SHOPIFY_APP_URL}/api/trello/webhooks`;

  // Create webhook
  const webhook = await client.createWebhook({
    description,
    callbackURL: callbackUrl,
    idModel: modelId,
  });

  // Store in database
  await prisma.trelloWebhook.create({
    data: {
      shopId,
      trelloWebhookId: webhook.id,
      modelId,
      callbackUrl,
      description,
      active: true,
    },
  });

  return webhook;
}

export async function unregisterTrelloWebhook(webhookId: string): Promise<void> {
  const webhook = await prisma.trelloWebhook.findUnique({
    where: { trelloWebhookId: webhookId },
    include: {
      shop: {
        include: {
          trelloConnections: true,
        },
      },
    },
  });

  if (!webhook || !webhook.shop.trelloConnections[0]) {
    throw new Error('Webhook or Trello connection not found');
  }

  const client = createTrelloClient(webhook.shop.trelloConnections[0].token);

  // Delete from Trello
  await client.deleteWebhook(webhookId);

  // Delete from database
  await prisma.trelloWebhook.delete({
    where: { trelloWebhookId: webhookId },
  });
}

export async function getActiveWebhooks(shopId: string) {
  return await prisma.trelloWebhook.findMany({
    where: {
      shopId,
      active: true,
    },
  });
}

