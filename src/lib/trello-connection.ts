import prisma from '@/lib/db'

export type TrelloMode = 'single' | 'multi'

export async function getTrelloMode(shopId: string): Promise<TrelloMode> {
  const settings = await prisma.settings.findUnique({
    where: { shopId },
    select: { trelloMode: true },
  })

  const mode = settings?.trelloMode === 'single' ? 'single' : 'multi'
  return mode
}

export async function getTrelloConnectionForUser(shopId: string, userId: string) {
  const mode = await getTrelloMode(shopId)

  if (mode === 'single') {
    const shared = await prisma.trelloConnection.findFirst({
      where: {
        shopId,
        userId: null,
      },
    })
    if (shared) {
      return shared
    }
  }

  const userConnection = await prisma.trelloConnection.findFirst({
    where: {
      shopId,
      userId,
    },
  })

  if (userConnection) {
    return userConnection
  }

  return prisma.trelloConnection.findFirst({
    where: {
      shopId,
      userId: null,
    },
  })
}

export async function assertTrelloConnection(shopId: string, userId: string) {
  const connection = await getTrelloConnectionForUser(shopId, userId)

  if (!connection) {
    const mode = await getTrelloMode(shopId)
    if (mode === 'single') {
      throw new Error('Store owner has not connected Trello yet')
    }
    throw new Error('Trello not connected for this user')
  }

  return connection
}


