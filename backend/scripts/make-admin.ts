import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    // Your email from the analytics output
    const adminEmail = 'cudechukwu@wesleyan.edu';
    
    console.log('🔧 Making user admin...');
    console.log('====================');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        role: true
      }
    });
    
    if (!user) {
      console.log(`❌ User with email ${adminEmail} not found!`);
      console.log('Available users:');
      const users = await prisma.user.findMany({
        select: { email: true, firstName: true, lastName: true },
        take: 10
      });
      users.forEach(u => console.log(`  - ${u.firstName} ${u.lastName} (${u.email})`));
      return;
    }
    
    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   Current admin status: ${user.isAdmin}`);
    console.log(`   Current role: ${user.role}`);
    
    if (user.isAdmin) {
      console.log('🎉 User is already an admin!');
      return;
    }
    
    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        role: true
      }
    });
    
    console.log('🎉 Successfully granted admin privileges!');
    console.log(`   ${updatedUser.firstName} ${updatedUser.lastName} is now an admin`);
    console.log(`   Admin status: ${updatedUser.isAdmin}`);
    console.log('');
    console.log('🚀 You can now access the admin dashboard at /admin');
    console.log('🔒 Only you will be able to see the user analytics and admin features');
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the admin setup
makeUserAdmin();

