import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDepartments() {
  try {
    console.log('🔍 Analyzing all departments and courses in database...\n');

    // Get all courses with their department info
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        department: true,
        title: true,
        professor: true,
        universityId: true,
      },
      orderBy: [
        { department: 'asc' },
        { code: 'asc' }
      ]
    });

    // Group courses by department
    const departmentGroups: { [key: string]: any[] } = {};
    courses.forEach(course => {
      if (!departmentGroups[course.department]) {
        departmentGroups[course.department] = [];
      }
      departmentGroups[course.department].push(course);
    });

    console.log('📚 Department Analysis:\n');
    
    Object.entries(departmentGroups).forEach(([dept, deptCourses]) => {
      console.log(`🏛️  ${dept} (${deptCourses.length} courses):`);
      
      // Show first few courses as examples
      deptCourses.slice(0, 3).forEach(course => {
        console.log(`   • ${course.code}: ${course.title} - ${course.professor || 'No professor'}`);
      });
      
      if (deptCourses.length > 3) {
        console.log(`   ... and ${deptCourses.length - 3} more courses`);
      }
      console.log('');
    });

    // Identify potential duplicates (similar names)
    console.log('🔍 Potential Duplicate Analysis:\n');
    
    const departmentNames = Object.keys(departmentGroups);
    const potentialDuplicates: string[][] = [];
    
    for (let i = 0; i < departmentNames.length; i++) {
      for (let j = i + 1; j < departmentNames.length; j++) {
        const dept1 = departmentNames[i].toLowerCase();
        const dept2 = departmentNames[j].toLowerCase();
        
        // Check for similar names
        if (dept1.includes(dept2) || dept2.includes(dept1) || 
            dept1.startsWith(dept2) || dept2.startsWith(dept1)) {
          potentialDuplicates.push([departmentNames[i], departmentNames[j]]);
        }
      }
    }

    if (potentialDuplicates.length > 0) {
      console.log('⚠️  Potential duplicate departments found:');
      potentialDuplicates.forEach(([dept1, dept2]) => {
        console.log(`   • "${dept1}" vs "${dept2}"`);
      });
    } else {
      console.log('✅ No obvious duplicates found');
    }

    // Show courses with "Computer Science" and "COMP" to verify the issue
    console.log('\n🔍 Specific Issue Analysis:\n');
    
    const compCourses = courses.filter(c => c.department === 'COMP');
    const compSciCourses = courses.filter(c => c.department === 'Computer Science');
    
    if (compCourses.length > 0) {
      console.log('✅ COMP department courses:');
      compCourses.slice(0, 5).forEach(course => {
        console.log(`   • ${course.code}: ${course.title} - ${course.professor || 'No professor'}`);
      });
      if (compCourses.length > 5) console.log(`   ... and ${compCourses.length - 5} more`);
    }
    
    if (compSciCourses.length > 0) {
      console.log('\n❌ Computer Science department courses (incorrect):');
      compSciCourses.forEach(course => {
        console.log(`   • ${course.code}: ${course.title} - ${course.professor || 'No professor'}`);
      });
    }

    console.log('\n📊 Summary:');
    console.log(`   Total departments: ${Object.keys(departmentGroups).length}`);
    console.log(`   Total courses: ${courses.length}`);
    console.log(`   COMP courses: ${compCourses.length}`);
    console.log(`   Computer Science courses: ${compSciCourses.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
analyzeDepartments();
