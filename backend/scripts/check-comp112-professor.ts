import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkComp112Professor() {
  try {
    console.log('🔍 Checking COMP 112 professor and COMP department courses...\n');

    // Check COMP 112 specifically
    const comp112 = await prisma.course.findFirst({
      where: {
        AND: [
          { department: 'COMP' },
          { number: '112' }
        ]
      }
    });

    if (comp112) {
      console.log('📚 COMP 112: Introduction to Programming');
      console.log(`   Professor: ${comp112.professor || 'No professor assigned'}`);
      console.log(`   Course ID: ${comp112.id}`);
      console.log(`   Department: ${comp112.department}`);
      console.log(`   Course Number: ${comp112.number}`);
      console.log(`   Title: ${comp112.title}`);
      console.log(`   Code: ${comp112.code}`);
      console.log('');
    } else {
      console.log('❌ COMP 112 not found in database');
      console.log('');
    }

    // Get all COMP department courses
    const compCourses = await prisma.course.findMany({
      where: {
        department: 'COMP'
      },
      orderBy: {
        number: 'asc'
      }
    });

    console.log('📚 COMP Department Courses:');
    if (compCourses.length > 0) {
      compCourses.forEach(course => {
        const profName = course.professor || 'No professor assigned';
        console.log(`   • ${course.department}${course.number}: ${course.title} - ${profName}`);
      });
    } else {
      console.log('   No COMP courses found');
    }

    console.log('');

    // Check for any courses with "Computer Science" or similar department names
    const computerScienceCourses = await prisma.course.findMany({
      where: {
        OR: [
          { department: { contains: 'Computer' } },
          { department: { contains: 'COMP' } },
          { department: { contains: 'CS' } }
        ]
      },
      select: {
        department: true,
        number: true,
        title: true
      },
      orderBy: [
        { department: 'asc' },
        { number: 'asc' }
      ]
    });

    if (computerScienceCourses.length > 0) {
      console.log('🔍 Courses with Computer-related department names:');
      computerScienceCourses.forEach(course => {
        console.log(`   • ${course.department}${course.number}: ${course.title}`);
      });
    }

    // Check total course count
    const totalCourses = await prisma.course.count();
    const compCourseCount = await prisma.course.count({
      where: { department: 'COMP' }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total courses in database: ${totalCourses}`);
    console.log(`   COMP department courses: ${compCourseCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkComp112Professor();
