import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Minimal dev seed: 2 users, 1 private conversation, participants, and 2 messages
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash: 'dev-hash-alice',
      displayName: 'Alice',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash: 'dev-hash-bob',
      displayName: 'Bob',
    },
  });

  const conv = await prisma.conversation.create({
    data: {
      type: 'private',
      participants: {
        createMany: {
          data: [
            { userId: alice.id, role: 'member' },
            { userId: bob.id, role: 'member' },
          ],
        },
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: alice.id,
      contentType: 'text',
      content: 'Hello Bob!',
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: bob.id,
      contentType: 'text',
      content: 'Hey Alice!',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
