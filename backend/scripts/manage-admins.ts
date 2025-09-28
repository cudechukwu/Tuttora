import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function manageAdmins() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Admin Management Script');
    console.log('========================');
    console.log('Usage:');
    console.log('  npx ts-node scripts/manage-admins.ts list                    # List all admins');
    console.log('  npx ts-node scripts/manage-admins.ts grant <email>          # Grant admin access');
    console.log('  npx ts-node scripts/manage-admins.ts revoke <email>         # Revoke admin access');
    console.log('  npx ts-node scripts/manage-admins.ts check <email>          # Check admin status');
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-node scripts/manage-admins.ts list');
    console.log('  npx ts-node scripts/manage-admins.ts grant user@example.com');
    console.log('  npx ts-node scripts/manage-admins.ts revoke user@example.com');
    return;
  }
  
  const command = args[0];
  const email = args[1];
  
  try {
    switch (command) {
      case 'list':
        await listAdmins();
        break;
        
      case 'grant':
        if (!email) {
          console.log('❌ Email required for grant command');
          return;
        }
        await grantAdmin(email);
        break;
        
      case 'revoke':
        if (!email) {
          console.log('❌ Email required for revoke command');
          return;
        }
        await revokeAdmin(email);
        break;
        
      case 'check':
        if (!email) {
          console.log('❌ Email required for check command');
          return;
        }
        await checkAdmin(email);
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Valid commands: list, grant, revoke, check');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function listAdmins() {
  console.log('👑 Current Admins');
  console.log('================');
  
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      lastSeen: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  if (admins.length === 0) {
    console.log('No admins found');
    return;
  }
  
  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Joined: ${admin.createdAt.toLocaleDateString()}`);
    console.log(`   Last Seen: ${admin.lastSeen.toLocaleDateString()}`);
    console.log('');
  });
}

async function grantAdmin(email: string) {
  console.log(`🔧 Granting admin access to ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, lastName: true, isAdmin: true }
  });
  
  if (!user) {
    console.log(`❌ User with email ${email} not found`);
    return;
  }
  
  if (user.isAdmin) {
    console.log(`✅ ${user.firstName} ${user.lastName} is already an admin`);
    return;
  }
  
  await prisma.user.update({
    where: { email },
    data: { isAdmin: true }
  });
  
  console.log(`✅ Successfully granted admin access to ${user.firstName} ${user.lastName}`);
}

async function revokeAdmin(email: string) {
  console.log(`🔧 Revoking admin access from ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, lastName: true, isAdmin: true }
  });
  
  if (!user) {
    console.log(`❌ User with email ${email} not found`);
    return;
  }
  
  if (!user.isAdmin) {
    console.log(`✅ ${user.firstName} ${user.lastName} is not an admin`);
    return;
  }
  
  await prisma.user.update({
    where: { email },
    data: { isAdmin: false }
  });
  
  console.log(`✅ Successfully revoked admin access from ${user.firstName} ${user.lastName}`);
}

async function checkAdmin(email: string) {
  console.log(`🔍 Checking admin status for ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { 
      firstName: true, 
      lastName: true, 
      isAdmin: true, 
      role: true,
      createdAt: true 
    }
  });
  
  if (!user) {
    console.log(`❌ User with email ${email} not found`);
    return;
  }
  
  console.log(`👤 ${user.firstName} ${user.lastName}`);
  console.log(`📧 Email: ${email}`);
  console.log(`👑 Admin: ${user.isAdmin ? 'YES' : 'NO'}`);
  console.log(`🎭 Role: ${user.role}`);
  console.log(`📅 Joined: ${user.createdAt.toLocaleDateString()}`);
}

// Run the admin management
manageAdmins();

