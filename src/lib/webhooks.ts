/**
 * Webhook registration and management utilities
 */

import { createTrelloClient } from './trello'
import prisma from './db'
import { assertTrelloConnection } from './trello-connection'

export async function registerTrelloWebhook(
  shopId: string,
  userId: string,
  modelId: string,
  description: string
): Promise<any> {
  const trelloConnection = await assertTrelloConnection(shopId, userId)
  const client = createTrelloClient(trelloConnection.token)
  const callbackUrl = `${process.env.SHOPIFY_APP_URL}/api/trello/webhooks`

  const webhook = await client.createWebhook({
    description,
    callbackURL: callbackUrl,
    idModel: modelId,
  })

  await prisma.trelloWebhook.create({
    data: {
      shopId,
      userId,
      trelloWebhookId: webhook.id,
      modelId,
      callbackUrl,
      description,
      active: true,
    },
  })

  return webhook
}

export async function unregisterTrelloWebhook(webhookId: string): Promise<void> {
  const webhook = await prisma.trelloWebhook.findUnique({
    where: { trelloWebhookId: webhookId },
  })

  if (!webhook) {
    throw new Error('Webhook not found')
  }

  const trelloConnection = webhook.userId
    ? await assertTrelloConnection(webhook.shopId, webhook.userId)
    : await prisma.trelloConnection.findFirst({ where: { shopId: webhook.shopId } })

  if (!trelloConnection) {
    throw new Error('Trello connection not found for webhook owner')
  }

  const client = createTrelloClient(trelloConnection.token)

  await client.deleteWebhook(webhookId)

  await prisma.trelloWebhook.delete({
    where: { trelloWebhookId: webhookId },
  })
}

export async function getActiveWebhooks(shopId: string, userId?: string) {
  return prisma.trelloWebhook.findMany({
    where: {
      shopId,
      active: true,
      ...(userId ? { userId } : {}),
    },
  })
}

