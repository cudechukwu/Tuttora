import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUserAnalytics() {
  try {
    console.log('📊 TuttoPassa User Analytics');
    console.log('==========================');
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all analytics in parallel
    const [
      totalUsers,
      totalTutos,
      totalRookies,
      totalBothRole,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      totalSessions,
      completedSessions,
      activeSessions,
      totalUniversities,
      totalCourses
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TUTO' } }),
      prisma.user.count({ where: { role: 'ROOKIE' } }),
      prisma.user.count({ where: { role: 'BOTH' } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.session.count(),
      prisma.session.count({ where: { status: 'COMPLETED' } }),
      prisma.session.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.university.count(),
      prisma.course.count()
    ]);

    console.log('\n👥 USER STATISTICS');
    console.log('------------------');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Tutors: ${totalTutos}`);
    console.log(`Rookies: ${totalRookies}`);
    console.log(`Both Roles: ${totalBothRole}`);

    console.log('\n📈 REGISTRATION TRENDS');
    console.log('----------------------');
    console.log(`Registered Today: ${usersToday}`);
    console.log(`Registered This Week: ${usersThisWeek}`);
    console.log(`Registered This Month: ${usersThisMonth}`);

    console.log('\n📚 SESSION STATISTICS');
    console.log('--------------------');
    console.log(`Total Sessions: ${totalSessions}`);
    console.log(`Completed Sessions: ${completedSessions}`);
    console.log(`Active Sessions: ${activeSessions}`);

    console.log('\n🏫 PLATFORM CONTENT');
    console.log('-------------------');
    console.log(`Universities: ${totalUniversities}`);
    console.log(`Courses: ${totalCourses}`);

    // Get recent registrations
    const recentUsers = await prisma.user.findMany({
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        university: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n🆕 RECENT REGISTRATIONS');
    console.log('-----------------------');
    recentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.role}) - ${user.university.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Joined: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    console.log('✅ Analytics complete!');
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analytics
getUserAnalytics();

