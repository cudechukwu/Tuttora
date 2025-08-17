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

    // Also check all sessions for this user to see the ratings
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

    console.log('\nSession Ratings:');
    sessions.forEach(session => {
      const isTuto = session.tutoId === userId;
      const rating = isTuto ? session.rookieRating : session.tutoRating;
      const role = isTuto ? 'TUTO' : 'ROOKIE';
      console.log(`Session ${session.id}: ${role} received ${rating} stars on ${session.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRating(); 