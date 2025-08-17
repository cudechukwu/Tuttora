import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isOnline: true,
        isAvailable: true,
        lastSeen: true,
        university: {
          select: {
            id: true,
            name: true
          }
        },
        userCourses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                department: true,
                credits: true,
                professor: true,
                term: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isOnline: true,
        isAvailable: true,
        lastSeen: true,
        university: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

export const getAvailableTutors = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;

    const whereClause: any = {
      isAvailable: true,
      OR: [
        { role: 'TUTO' },
        { role: 'BOTH' }
      ]
    };

    if (courseId) {
      whereClause.userCourses = {
        some: {
          courseId: courseId as string,
          isActive: true
        }
      };
    }

    const tutors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isOnline: true,
        isAvailable: true,
        lastSeen: true,
        university: {
          select: {
            id: true,
            name: true
          }
        },
        userCourses: {
          where: { isActive: true },
          include: {
                            course: {
                  select: {
                    id: true,
                    code: true,
                    title: true,
                    department: true,
                    credits: true,
                    professor: true,
                    term: true
                  }
                }
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.json({
      success: true,
      data: tutors
    });
  } catch (error) {
    console.error('Error fetching available tutors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available tutors'
    });
  }
};

export const addUserCourse = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { courseId, expertiseLevel = 'BEGINNER', proficiencyLevel, semesterTaken, yearCompleted } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Validate yearCompleted if provided
    if (yearCompleted !== undefined && yearCompleted !== null) {
      const currentYear = new Date().getFullYear();
      if (yearCompleted > currentYear) {
        return res.status(400).json({
          success: false,
          message: 'Year completed cannot be in the future'
        });
      }
    }

    // Validate semesterTaken if provided
    if (semesterTaken && !['FALL', 'SPRING', 'SUMMER', 'WINTER'].includes(semesterTaken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester value'
      });
    }

    // Check if user is a tuto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'TUTO') {
      return res.status(403).json({
        success: false,
        message: 'Only tutos can add course expertise'
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Add or update user course
    const userCourse = await prisma.userCourse.upsert({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      update: {
        expertiseLevel,
        proficiencyLevel,
        semesterTaken,
        yearCompleted,
        isActive: true
      },
      create: {
        userId: userId,
        courseId: courseId,
        expertiseLevel,
        proficiencyLevel,
        semesterTaken,
        yearCompleted,
        isActive: true
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            number: true,
            title: true,
            department: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Course expertise added successfully',
      data: userCourse
    });
  } catch (error) {
    console.error('Error adding user course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course expertise'
    });
  }
};

export const updateUserCourseDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { courseId } = req.params;
    const { proficiencyLevel, semesterTaken, yearCompleted } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Validate yearCompleted if provided
    if (yearCompleted !== undefined && yearCompleted !== null) {
      const currentYear = new Date().getFullYear();
      if (yearCompleted > currentYear) {
        return res.status(400).json({
          success: false,
          message: 'Year completed cannot be in the future'
        });
      }
    }

    // Validate semesterTaken if provided
    if (semesterTaken && !['FALL', 'SPRING', 'SUMMER', 'WINTER'].includes(semesterTaken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester value'
      });
    }

    // Check if user is a tuto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'TUTO') {
      return res.status(403).json({
        success: false,
        message: 'Only tutos can update course details'
      });
    }

    // Check if user course exists
    const userCourse = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            number: true,
            title: true,
            department: true
          }
        }
      }
    });

    if (!userCourse) {
      return res.status(404).json({
        success: false,
        message: 'User course not found'
      });
    }

    // Update course details
    const updatedUserCourse = await prisma.userCourse.update({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      data: {
        proficiencyLevel,
        semesterTaken,
        yearCompleted
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            number: true,
            title: true,
            department: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Course details updated successfully',
      data: updatedUserCourse
    });
  } catch (error) {
    console.error('Error updating user course details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course details'
    });
  }
};

export const getRookieSubjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get user's registered courses
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCourses: {
          where: { isActive: true },
          include: {
            course: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'ROOKIE') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only for rookies'
      });
    }

    // Format user's courses
    const userCourses = user.userCourses.map(uc => ({
      id: uc.course.id,
      code: uc.course.code,
      title: uc.course.title,
      department: uc.course.department,
      displayName: `${uc.course.code} - ${uc.course.title}`
    }));

    // General subjects that are always available
    const generalSubjects = [
      { id: 'general-math', code: 'GEN-MATH', title: 'General Math Help', department: 'General', displayName: 'General Math Help' },
      { id: 'essay-writing', code: 'GEN-WRIT', title: 'Essay Writing', department: 'General', displayName: 'Essay Writing' },
      { id: 'intro-stats', code: 'GEN-STAT', title: 'Intro to Statistics', department: 'General', displayName: 'Intro to Statistics' },
      { id: 'study-skills', code: 'GEN-STUDY', title: 'Study Skills / Organization', department: 'General', displayName: 'Study Skills / Organization' },
      { id: 'other', code: 'GEN-OTHER', title: 'Other', department: 'General', displayName: 'Other' }
    ];

    // Combine user courses with general subjects
    const allSubjects = [...userCourses, ...generalSubjects];

    res.json({
      success: true,
      data: {
        userCourses,
        generalSubjects,
        allSubjects
      }
    });
  } catch (error) {
    console.error('Error fetching rookie subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rookie subjects'
    });
  }
}; 