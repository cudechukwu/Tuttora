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

async function importWesleyanCourses() {
  try {
    console.log('🚀 Starting Wesleyan courses import...');

    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../wesleyan courses/wesleyan_courses_fall_2025.json');
    const coursesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as WesleyanCourse[];

    console.log(`📚 Found ${coursesData.length} courses to import`);

    // Get Wesleyan University ID (create if doesn't exist)
    let wesleyan = await prisma.university.findFirst({
      where: { name: 'Wesleyan University' }
    });

    if (!wesleyan) {
      wesleyan = await prisma.university.create({
        data: {
          name: 'Wesleyan University',
          domain: 'wesleyan.edu',
          location: 'Middletown, CT'
        }
      });
      console.log('✅ Created Wesleyan University record');
    } else {
      console.log('✅ Found existing Wesleyan University record');
    }

    // Import courses
    let importedCount = 0;
    let skippedCount = 0;

    for (const courseData of coursesData) {
      try {
        // Check if course already exists
        const existingCourse = await prisma.course.findFirst({
          where: {
            code: courseData.code,
            universityId: wesleyan.id
          }
        });

        if (existingCourse) {
          skippedCount++;
          continue;
        }

        // Create the course
        await prisma.course.create({
          data: {
            code: courseData.code,
            number: courseData.number,
            title: courseData.title,
            department: courseData.department,
            credits: courseData.credits,
            professor: courseData.professor || null,
            term: courseData.term || null,
            universityId: wesleyan.id
          }
        });

        importedCount++;
        
        if (importedCount % 100 === 0) {
          console.log(`📝 Imported ${importedCount} courses...`);
        }
      } catch (error) {
        console.error(`❌ Error importing course ${courseData.code}:`, error);
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`📊 Imported: ${importedCount} courses`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} courses`);
    console.log(`📚 Total processed: ${coursesData.length} courses`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importWesleyanCourses(); 