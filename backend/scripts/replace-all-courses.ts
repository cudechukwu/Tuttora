import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface WesleyanCourse {
  id: string;
  code: string;
  number: string;
  title: string;
  department: string;
  description: string;
  professor: string;
  term: string;
  genEdArea: string | null;
  level: string;
  credits: number;
  prerequisites: string | null;
  location: string;
  time: string;
  createdAt: string;
}

async function replaceAllCourses() {
  try {
    console.log('🔄 Starting complete course database replacement...\n');

    // Read the Wesleyan courses JSON file
    const jsonPath = path.join(__dirname, '..', 'wesleyan courses', 'wesleyan_courses_fall_2025.json');
    console.log(`📖 Reading courses from: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error('Wesleyan courses JSON file not found!');
    }

    const coursesData: WesleyanCourse[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📚 Found ${coursesData.length} courses in JSON file\n`);

    // Get the university ID (assuming Wesleyan is the first/only university)
    const university = await prisma.university.findFirst();
    if (!university) {
      throw new Error('No university found in database!');
    }
    console.log(`🏫 Using university: ${university.name} (ID: ${university.id})\n`);

    // Count current courses in database
    const currentCourseCount = await prisma.course.count();
    console.log(`📊 Current courses in database: ${currentCourseCount}`);

    // Delete all existing courses
    console.log('🗑️  Deleting all existing courses...');
    const deleteResult = await prisma.course.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} existing courses\n`);

    // Insert all courses from JSON
    console.log('📥 Inserting courses from JSON file...');
    
    const coursesToInsert = coursesData.map(course => ({
      code: course.code,
      department: course.department,
      universityId: university.id,
      credits: course.credits,
      number: course.number,
      professor: course.professor,
      term: course.term,
      title: course.title
    }));

    // Insert in batches to avoid memory issues
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < coursesToInsert.length; i += batchSize) {
      const batch = coursesToInsert.slice(i, i + batchSize);
      const result = await prisma.course.createMany({
        data: batch,
        skipDuplicates: true
      });
      insertedCount += result.count;
      console.log(`   Batch ${Math.floor(i / batchSize) + 1}: Inserted ${result.count} courses`);
    }

    console.log(`\n✅ Successfully inserted ${insertedCount} courses`);

    // Verify the insertion
    const finalCourseCount = await prisma.course.count();
    console.log(`📊 Final course count in database: ${finalCourseCount}`);

    // Check COMP courses specifically
    const compCourses = await prisma.course.findMany({
      where: { department: 'COMP' },
      orderBy: { number: 'asc' }
    });

    console.log(`\n📚 COMP Department Courses (${compCourses.length} total):`);
    compCourses.forEach(course => {
      console.log(`   • ${course.department}${course.number}: ${course.title} - ${course.professor || 'No professor'}`);
    });

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
      console.log(`\n🎯 COMP 112 Verification:`);
      console.log(`   Professor: ${comp112.professor}`);
      console.log(`   Title: ${comp112.title}`);
      console.log(`   Department: ${comp112.department}`);
      console.log(`   Number: ${comp112.number}`);
    }

    console.log('\n🎉 Course database replacement complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
replaceAllCourses();
