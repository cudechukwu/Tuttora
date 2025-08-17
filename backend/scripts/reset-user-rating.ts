import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUserRating() {
  try {
    const userId = 'cmdavswop000156yant04x1sh'; // Ekene's ID
    
    // Get all sessions for this user with actual ratings
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

    // Calculate actual ratings
    let totalRating = 0;
    let ratingCount = 0;
    
    sessions.forEach(session => {
      const isTuto = session.tutoId === userId;
      const rating = isTuto ? session.rookieRating : session.tutoRating;
      
      if (rating !== null) {
        console.log(`Session ${session.id}: ${isTuto ? 'TUTO' : 'ROOKIE'} received ${rating} stars`);
        totalRating += rating;
        ratingCount++;
      }
    });

    const actualAverage = ratingCount > 0 ? totalRating / ratingCount : 5.0;
    
    console.log(`\nActual Ratings:`);
    console.log(`Total Rating: ${totalRating}`);
    console.log(`Rating Count: ${ratingCount}`);
    console.log(`Calculated Average: ${actualAverage.toFixed(2)}`);

    // Update user with correct values
    await prisma.user.update({
      where: { id: userId },
      data: {
        averageRating: actualAverage,
        totalRatings: ratingCount
      }
    });

    console.log(`\n✅ User rating reset successfully!`);
    console.log(`Updated to: Average: ${actualAverage.toFixed(2)}, Count: ${ratingCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserRating(); 