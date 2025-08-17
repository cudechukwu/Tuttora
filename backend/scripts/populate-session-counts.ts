import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateSessionCounts() {
  console.log('Starting to populate session counts...');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      // Count completed sessions for this user
      const completedSessions = await prisma.session.count({
        where: {
          OR: [
            { rookieId: user.id },
            { tutoId: user.id }
          ],
          status: 'COMPLETED'
        }
      });

      // Update the user's session count
      await prisma.user.update({
        where: { id: user.id },
        data: { sessionCount: completedSessions }
      });

      console.log(`Updated user ${user.id} with ${completedSessions} completed sessions`);
    }

    console.log('Session count population completed successfully!');
  } catch (error) {
    console.error('Error populating session counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateSessionCounts(); 