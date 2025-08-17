import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateUserRatings() {
  console.log('Starting to populate user ratings...');
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    console.log(`Found ${users.length} users to update`);
    
    for (const user of users) {
      // Get all completed sessions where this user was rated
      const ratedSessions = await prisma.session.findMany({
        where: {
          OR: [
            { tutoId: user.id },
            { rookieId: user.id }
          ],
          status: 'COMPLETED',
          rating: { not: null }
        },
        select: { rating: true }
      });

      if (ratedSessions.length > 0) {
        // Calculate average rating
        const totalRating = ratedSessions.reduce((sum, session) => sum + (session.rating || 0), 0);
        const averageRating = totalRating / ratedSessions.length;
        const totalRatings = ratedSessions.length;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            averageRating: averageRating,
            totalRatings: totalRatings
          }
        });

        console.log(`Updated user ${user.id} with average rating ${averageRating.toFixed(2)} from ${totalRatings} ratings`);
      } else {
        // No ratings yet, keep default values
        console.log(`User ${user.id} has no ratings yet, keeping defaults`);
      }
    }
    
    console.log('User rating population completed successfully!');
  } catch (error) {
    console.error('Error populating user ratings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateUserRatings(); 