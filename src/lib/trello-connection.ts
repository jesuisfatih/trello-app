import prisma from '@/lib/db'

export async function getTrelloConnectionForUser(shopId: string, userId: string) {
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
    throw new Error('Trello not connected for this user')
  }

  return connection
}


