import { PrismaClient, CourseLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create universities
  const universities = [
    {
      name: 'University of California, Berkeley',
      domain: 'berkeley.edu',
      location: 'Berkeley, CA'
    },
    {
      name: 'Stanford University',
      domain: 'stanford.edu',
      location: 'Stanford, CA'
    },
    {
      name: 'Massachusetts Institute of Technology',
      domain: 'mit.edu',
      location: 'Cambridge, MA'
    },
    {
      name: 'Harvard University',
      domain: 'harvard.edu',
      location: 'Cambridge, MA'
    },
    {
      name: 'Wesleyan University',
      domain: 'wesleyan.edu',
      location: 'Middletown, CT'
    },
    {
      name: 'University of Toronto',
      domain: 'utoronto.ca',
      location: 'Toronto, ON'
    },
    {
      name: 'McGill University',
      domain: 'mcgill.ca',
      location: 'Montreal, QC'
    },
    {
      name: 'University of British Columbia',
      domain: 'ubc.ca',
      location: 'Vancouver, BC'
    }
  ];

  for (const university of universities) {
    const existing = await prisma.university.findUnique({
      where: { domain: university.domain }
    });

    if (!existing) {
      await prisma.university.create({
        data: university
      });
      console.log(`✅ Created university: ${university.name}`);
    } else {
      console.log(`⏭️  University already exists: ${university.name}`);
    }
  }

  // Create courses
  const courses = [
    {
      code: 'CS61A',
      number: '61A',
      title: 'Structure and Interpretation of Computer Programs',
      department: 'Computer Science',
      credits: 4,
      professor: 'John DeNero',
      term: 'Fall 2025'
    },
    {
      code: 'CS106B',
      number: '106B',
      title: 'Programming Abstractions',
      department: 'Computer Science',
      credits: 4,
      professor: 'Julie Zelenski',
      term: 'Fall 2025'
    },
    {
      code: '6.006',
      number: '6.006',
      title: 'Introduction to Algorithms',
      department: 'Computer Science',
      credits: 4,
      professor: 'Erik Demaine',
      term: 'Fall 2025'
    },
    {
      code: 'MATH101',
      number: '101',
      title: 'Calculus I',
      department: 'Mathematics',
      credits: 4,
      professor: 'James Smith',
      term: 'Fall 2025'
    },
    {
      code: 'PHYS101',
      number: '101',
      title: 'Physics I',
      department: 'Physics',
      credits: 4,
      professor: 'Jane Doe',
      term: 'Fall 2025'
    },
    {
      code: 'CHEM101',
      number: '101',
      title: 'General Chemistry',
      department: 'Chemistry',
      credits: 4,
      professor: 'Albert Brown',
      term: 'Fall 2025'
    }
  ];

  const berkeley = await prisma.university.findUnique({ where: { domain: 'berkeley.edu' } });
  const stanford = await prisma.university.findUnique({ where: { domain: 'stanford.edu' } });
  const mit = await prisma.university.findUnique({ where: { domain: 'mit.edu' } });
  const wesleyan = await prisma.university.findUnique({ where: { domain: 'wesleyan.edu' } });

  // Create courses for other universities
  for (const course of courses) {
    const universityId = berkeley?.id || stanford?.id || mit?.id;
    if (!universityId) continue;
    
    const existing = await prisma.course.findFirst({
      where: { 
        code: course.code,
        universityId
      }
    });
    
    if (!existing) {
      await prisma.course.create({ 
        data: {
          ...course,
          universityId
        }
      });
      console.log(`✅ Created course: ${course.code}`);
    } else {
      console.log(`⏭️  Course already exists: ${course.code}`);
    }
  }

  // Import real Wesleyan University courses from your actual data
  if (wesleyan?.id) {
    console.log('🌱 Importing real Wesleyan courses...');
    
    try {
      // Import and run the real Wesleyan courses script
      await import('../scripts/importWesleyanCourses');
      console.log('✅ Real Wesleyan courses imported successfully!');
    } catch (error) {
      console.error('❌ Error importing Wesleyan courses:', error);
      console.log('⚠️  Wesleyan course import failed - no fallback courses created');
    }
  } else {
    console.log('⚠️  Wesleyan University not found, skipping Wesleyan courses');
  }

  // Create comprehensive sample users with profiles and dashboard stats
  const sampleUsers = [
    {
      email: 'sarah.tuto@berkeley.edu',
      password: '$2a$10$KBfUdTLnMvWkEVet.tU0JuXMBiuDpiFRjlBOUL6mFdtPlv6oIp3ci', // test1234#
      username: 'sarah-tuto',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'TUTO' as const,
      universityId: berkeley?.id || '',
      profileCompleted: true,
      tutoProfile: {
        preferredName: 'Sarah',
        selectedAvatar: 'sarah.jpg',
        pronouns: 'she/her',
        yearOfStudy: '4',
        major: 'Computer Science',
        gpa: '3.9',
        teachingBio: 'Passionate CS tutor with 3+ years of experience helping students understand programming fundamentals. Specializing in Python, Java, and algorithms.',
        ratePerSession: '45',
        availability: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        certifications: 'CS61A Teaching Assistant, Python Programming Certificate',
        tutoringSubjects: ['CS61A', 'CS106B', 'MATH101']
      }
    },
    {
      email: 'alex.rookie@stanford.edu',
      password: '$2a$10$KBfUdTLnMvWkEVet.tU0JuXMBiuDpiFRjlBOUL6mFdtPlv6oIp3ci', // test1234#
      username: 'alex-rookie',
      firstName: 'Alex',
      lastName: 'Johnson',
      role: 'ROOKIE' as const,
      universityId: stanford?.id || '',
      profileCompleted: true,
      rookieProfile: {
        preferredName: 'Alex',
        selectedAvatar: 'alex.jpg',
        pronouns: 'they/them',
        yearOfStudy: '2',
        major: 'Mathematics',
        subjectsSeekingHelp: ['CS106B', 'MATH101', 'PHYS101'],
        learningStyle: ['Visual and hands-on'],
        learningNeeds: ['Patient tutors who can explain complex concepts simply'],
        tutoringExperience: 'First time seeking tutoring'
      }
    },
    {
      email: 'mike.tuto@mit.edu',
      password: '$2a$10$KBfUdTLnMvWkEVet.tU0JuXMBiuDpiFRjlBOUL6mFdtPlv6oIp3ci', // test1234#
      username: 'mike-tuto',
      firstName: 'Mike',
      lastName: 'Chen',
      role: 'TUTO' as const,
      universityId: mit?.id || '',
      profileCompleted: true,
      tutoProfile: {
        preferredName: 'Mike',
        selectedAvatar: 'mike.jpg',
        pronouns: 'he/him',
        yearOfStudy: '3',
        major: 'Physics',
        gpa: '3.8',
        teachingBio: 'Physics major with strong background in mathematics. I love helping students understand the beauty of physics through practical examples.',
        ratePerSession: '40',
        availability: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
        certifications: 'Physics Teaching Assistant, Calculus Tutor',
        tutoringSubjects: ['PHYS101', 'MATH101', 'CHEM101']
      }
    },
    {
      email: 'emma.rookie@harvard.edu',
      password: '$2a$10$KBfUdTLnMvWkEVet.tU0JuXMBiuDpiFRjlBOUL6mFdtPlv6oIp3ci', // test1234#
      username: 'emma-rookie',
      firstName: 'Emma',
      lastName: 'Davis',
      role: 'ROOKIE' as const,
      universityId: (await prisma.university.findUnique({ where: { domain: 'harvard.edu' } }))?.id || '',
      profileCompleted: true,
      rookieProfile: {
        preferredName: 'Emma',
        selectedAvatar: 'emma.jpg',
        pronouns: 'she/her',
        yearOfStudy: '1',
        major: 'Chemistry',
        subjectsSeekingHelp: ['CHEM101', 'MATH101'],
        learningStyle: ['Step-by-step explanations'],
        learningNeeds: ['Help with lab work and chemistry concepts'],
        tutoringExperience: 'First time seeking tutoring'
      }
    }
  ];

  for (const userData of sampleUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (!existing) {
      const user = await prisma.user.create({ 
        data: {
          email: userData.email,
          password: userData.password,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          universityId: userData.universityId
        }
      });
      
      // Create profile based on role
      if (userData.role === 'TUTO' && userData.tutoProfile) {
        await prisma.tutoProfile.create({
          data: {
            userId: user.id,
            ...userData.tutoProfile
          }
        });
      } else if (userData.role === 'ROOKIE' && userData.rookieProfile) {
        await prisma.rookieProfile.create({
          data: {
            userId: user.id,
            ...userData.rookieProfile
          }
        });
      }
      
      // Create comprehensive dashboard stats
      const statsData = {
        userId: user.id,
        totalPoints: userData.role === 'TUTO' ? Math.floor(Math.random() * 200) + 300 : Math.floor(Math.random() * 150) + 200,
        currentLevel: userData.role === 'TUTO' ? Math.floor(Math.random() * 3) + 4 : Math.floor(Math.random() * 3) + 2,
        experiencePoints: userData.role === 'TUTO' ? Math.floor(Math.random() * 500) + 1000 : Math.floor(Math.random() * 300) + 400,
        completedSessions: userData.role === 'TUTO' ? Math.floor(Math.random() * 20) + 25 : Math.floor(Math.random() * 15) + 10,
        averageRating: userData.role === 'TUTO' ? Math.random() * 0.4 + 4.5 : Math.random() * 0.3 + 4.6,
        totalTutoringTime: userData.role === 'TUTO' ? Math.floor(Math.random() * 400) + 800 : Math.floor(Math.random() * 200) + 300,
        currentStreak: userData.role === 'TUTO' ? Math.floor(Math.random() * 5) + 5 : Math.floor(Math.random() * 4) + 2,
        longestStreak: userData.role === 'TUTO' ? Math.floor(Math.random() * 10) + 12 : Math.floor(Math.random() * 8) + 6,
        totalEarnings: userData.role === 'TUTO' ? Math.floor(Math.random() * 500) + 800 : 0,
        totalSpent: userData.role === 'ROOKIE' ? Math.floor(Math.random() * 300) + 200 : 0,
        tutoRating: userData.role === 'TUTO' ? Math.random() * 0.4 + 4.5 : 0,
        rookieRating: userData.role === 'ROOKIE' ? Math.random() * 0.3 + 4.6 : 0,
        totalTutoSessions: userData.role === 'TUTO' ? Math.floor(Math.random() * 20) + 25 : 0,
        totalRookieSessions: userData.role === 'ROOKIE' ? Math.floor(Math.random() * 15) + 10 : 0,
        activeSessions: Math.floor(Math.random() * 3) + 1
      };

      await prisma.userStats.create({ data: statsData });
      
      console.log(`✅ Created user with profile and stats: ${userData.firstName} ${userData.lastName} (${userData.role})`);
    } else {
      console.log(`⏭️  User already exists: ${userData.firstName} ${userData.lastName}`);
    }
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 