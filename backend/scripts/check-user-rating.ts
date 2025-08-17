import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRating() {
  try {
    const userId = 'cmdavswop000156yant04x1sh'; // Ekene's ID
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        averageRating: true,
        totalRatings: true
      }
    });

    if (user) {
      console.log('User Rating Info:');
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Average Rating: ${user.averageRating}`);
      console.log(`Total Ratings: ${user.totalRatings}`);
    } else {
      console.log('User not found');
    }

    // Check all sessions for this user to see the ratings
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { tutoId: userId },
          { rookieId: userId }
        ],
        status: 'COMPLETED'
      },
      select: {
        id: true,
        tutoId: true,
        rookieId: true,
        tutoRating: true,
        rookieRating: true,
        createdAt: true
      }
    });

    console.log('\n=== TUTO RATINGS (when Ekene was TUTO) ===');
    let tutoTotalRating = 0;
    let tutoRatingCount = 0;
    
    sessions.forEach(session => {
      if (session.tutoId === userId && session.rookieRating !== null) {
        console.log(`Session ${session.id}: TUTO received ${session.rookieRating} stars on ${session.createdAt}`);
        tutoTotalRating += session.rookieRating;
        tutoRatingCount++;
      }
    });

    console.log(`\n=== ROOKIE RATINGS (when Ekene was ROOKIE) ===`);
    let rookieTotalRating = 0;
    let rookieRatingCount = 0;
    
    sessions.forEach(session => {
      if (session.rookieId === userId && session.tutoRating !== null) {
        console.log(`Session ${session.id}: ROOKIE received ${session.tutoRating} stars on ${session.createdAt}`);
        rookieTotalRating += session.tutoRating;
        rookieRatingCount++;
      }
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`TUTO Ratings: ${tutoRatingCount} ratings, total: ${tutoTotalRating}, avg: ${tutoRatingCount > 0 ? (tutoTotalRating / tutoRatingCount).toFixed(2) : 'N/A'}`);
    console.log(`ROOKIE Ratings: ${rookieRatingCount} ratings, total: ${rookieTotalRating}, avg: ${rookieRatingCount > 0 ? (rookieTotalRating / rookieRatingCount).toFixed(2) : 'N/A'}`);
    console.log(`Combined: ${tutoRatingCount + rookieRatingCount} ratings, total: ${tutoTotalRating + rookieTotalRating}, avg: ${(tutoRatingCount + rookieRatingCount) > 0 ? ((tutoTotalRating + rookieTotalRating) / (tutoRatingCount + rookieRatingCount)).toFixed(2) : 'N/A'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRating(); 