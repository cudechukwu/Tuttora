import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update academic profile information
export const updateAcademicProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { role, academicData } = req.body;

    if (!role || !academicData) {
      return res.status(400).json({
        success: false,
        message: 'Role and academic data are required'
      });
    }

    // Validate academic standing
    const validAcademicStandings = ['Dean\'s List', 'Honors', 'Regular', 'Probation'];
    if (academicData.academicStanding && !validAcademicStandings.includes(academicData.academicStanding)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic standing'
      });
    }

    // Validate graduation date
    if (academicData.expectedGraduationDate) {
      const graduationDate = new Date(academicData.expectedGraduationDate);
      const now = new Date();
      const tenYearsFromNow = new Date();
      tenYearsFromNow.setFullYear(now.getFullYear() + 10);

      if (graduationDate < now) {
        return res.status(400).json({
          success: false,
          message: 'Graduation date must be in the future'
        });
      }

      if (graduationDate > tenYearsFromNow) {
        return res.status(400).json({
          success: false,
          message: 'Graduation date cannot be more than 10 years in the future'
        });
      }
    }

    let result;
    
    if (role.toLowerCase() === 'tuto') {
      result = await prisma.tutoProfile.update({
        where: { userId },
        data: {
          academicStanding: academicData.academicStanding,
          expectedGraduationDate: academicData.expectedGraduationDate ? new Date(academicData.expectedGraduationDate) : null,
          academicAwards: academicData.academicAwards || [],
          researchExperience: academicData.researchExperience
        }
      });
    } else {
      result = await prisma.rookieProfile.update({
        where: { userId },
        data: {
          academicStanding: academicData.academicStanding,
          expectedGraduationDate: academicData.expectedGraduationDate ? new Date(academicData.expectedGraduationDate) : null,
          academicAwards: academicData.academicAwards || [],
          researchExperience: academicData.researchExperience
        }
      });
    }

    res.json({
      success: true,
      message: 'Academic profile updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating academic profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get academic profile information
export const getAcademicProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tutoProfile: true,
        rookieProfile: true,
        userCourses: {
          include: {
            course: true
          }
        },
        userSkills: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const academicProfile = {
      academicStanding: user.tutoProfile?.academicStanding || user.rookieProfile?.academicStanding,
      expectedGraduationDate: user.tutoProfile?.expectedGraduationDate || user.rookieProfile?.expectedGraduationDate,
      academicAwards: user.tutoProfile?.academicAwards || user.rookieProfile?.academicAwards || [],
      researchExperience: user.tutoProfile?.researchExperience || user.rookieProfile?.researchExperience,
      courses: user.userCourses,
      skills: user.userSkills
    };

    res.json({
      success: true,
      data: academicProfile
    });
  } catch (error) {
    console.error('Error fetching academic profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update course information
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { courseId } = req.params;
    const courseData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate grade format
    const validGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'P', 'W', 'I'];
    if (courseData.grade && !validGrades.includes(courseData.grade)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade format'
      });
    }

    // Validate difficulty rating
    if (courseData.difficultyRating && (courseData.difficultyRating < 1 || courseData.difficultyRating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Difficulty rating must be between 1 and 5'
      });
    }

    // Validate time spent
    if (courseData.timeSpent && (courseData.timeSpent < 0 || courseData.timeSpent > 168)) {
      return res.status(400).json({
        success: false,
        message: 'Time spent must be between 0 and 168 hours per week'
      });
    }

    const result = await prisma.userCourse.update({
      where: {
        id: courseId
      },
      data: {
        grade: courseData.grade,
        professor: courseData.professor,
        courseNotes: courseData.courseNotes,
        difficultyRating: courseData.difficultyRating,
        timeSpent: courseData.timeSpent,
        wouldRecommend: courseData.wouldRecommend,
        courseReview: courseData.courseReview
      },
      include: {
        course: true
      }
    });

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add or update user skill
export const updateSkill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const skillData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate self assessment
    if (skillData.selfAssessment && (skillData.selfAssessment < 1 || skillData.selfAssessment > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Self assessment must be between 1 and 5'
      });
    }

    const result = await prisma.userSkill.upsert({
      where: {
        userId_skillName: {
          userId,
          skillName: skillData.skillName
        }
      },
      update: {
        proficiencyLevel: skillData.proficiencyLevel,
        category: skillData.category,
        selfAssessment: skillData.selfAssessment,
        evidence: skillData.evidence || []
      },
      create: {
        userId,
        skillName: skillData.skillName,
        proficiencyLevel: skillData.proficiencyLevel,
        category: skillData.category,
        selfAssessment: skillData.selfAssessment,
        evidence: skillData.evidence || []
      }
    });

    res.json({
      success: true,
      message: 'Skill updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user skill
export const deleteSkill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { skillName } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    await prisma.userSkill.delete({
      where: {
        userId_skillName: {
          userId,
          skillName
        }
      }
    });

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get valid academic standings
export const getValidAcademicStandings = async (req: Request, res: Response) => {
  try {
    const validStandings = ['Dean\'s List', 'Honors', 'Regular', 'Probation'];
    
    res.json({
      success: true,
      data: validStandings
    });
  } catch (error) {
    console.error('Error fetching valid academic standings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get valid grades
export const getValidGrades = async (req: Request, res: Response) => {
  try {
    const validGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'P', 'W', 'I'];
    
    res.json({
      success: true,
      data: validGrades
    });
  } catch (error) {
    console.error('Error fetching valid grades:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Test endpoint to debug authentication
export const testEndpoint = async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
}; 

export const addCourse = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { courseId, proficiencyLevel, semesterTaken, yearCompleted, isActive = true } = req.body;

    // Validate required fields
    if (!courseId || !proficiencyLevel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course ID and proficiency level are required' 
      });
    }

    // Validate proficiency level
    const validLevels = ['CURRENTLY_TAKING', 'TOOK_COURSE', 'GOT_A', 'TUTORED_BEFORE', 'TAED'];
    if (!validLevels.includes(proficiencyLevel)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid proficiency level' 
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

    // Check if user already has this course
    const existingCourse = await prisma.userCourse.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (existingCourse) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have this course in your profile' 
      });
    }

    // Create new user course entry
    const userCourse = await prisma.userCourse.create({
      data: {
        userId,
        courseId,
        proficiencyLevel,
        semesterTaken,
        yearCompleted,
        isActive
      },
      include: {
        course: true
      }
    });

    res.json({ 
      success: true, 
      message: 'Course added successfully',
      data: userCourse
    });

  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add course' 
    });
  }
};

export const updateCourseProficiency = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { courseId } = req.params;
    const { proficiencyLevel, semesterTaken, yearCompleted, isActive } = req.body;

    // Validate proficiency level if provided
    if (proficiencyLevel) {
      const validLevels = ['CURRENTLY_TAKING', 'TOOK_COURSE', 'GOT_A', 'TUTORED_BEFORE', 'TAED'];
      if (!validLevels.includes(proficiencyLevel)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid proficiency level' 
        });
      }
    }

    // Find and update the user course
    const userCourse = await prisma.userCourse.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (!userCourse) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found in your profile' 
      });
    }

    const updatedCourse = await prisma.userCourse.update({
      where: { id: userCourse.id },
      data: {
        proficiencyLevel,
        semesterTaken,
        yearCompleted,
        isActive
      },
      include: {
        course: true
      }
    });

    res.json({ 
      success: true, 
      message: 'Course updated successfully',
      data: updatedCourse
    });

  } catch (error) {
    console.error('Error updating course proficiency:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update course' 
    });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { courseId } = req.params;

    // Find the user course
    const userCourse = await prisma.userCourse.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (!userCourse) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found in your profile' 
      });
    }

    // Delete the user course
    await prisma.userCourse.delete({
      where: { id: userCourse.id }
    });

    res.json({ 
      success: true, 
      message: 'Course removed successfully' 
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove course' 
    });
  }
};

export const getAvailableCourses = async (req: Request, res: Response) => {
  try {
    const { search, department, limit = 50 } = req.query;

    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { department: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (department) {
      whereClause.department = department;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      take: Number(limit),
      orderBy: [
        { department: 'asc' },
        { code: 'asc' }
      ]
    });

    res.json({ 
      success: true, 
      data: courses 
    });

  } catch (error) {
    console.error('Error fetching available courses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch courses' 
    });
  }
};

export const getValidProficiencyLevels = async (req: Request, res: Response) => {
  try {
    const validLevels = [
      { value: 'CURRENTLY_TAKING', label: 'Currently Taking', score: 0.1 },
      { value: 'TOOK_COURSE', label: 'Took Course', score: 0.2 },
      { value: 'GOT_A', label: 'Got A Grade', score: 0.3 },
      { value: 'TUTORED_BEFORE', label: 'Tutored Before', score: 0.4 },
      { value: 'TAED', label: 'Teaching Assistant', score: 0.5 }
    ];
    
    res.json({ success: true, data: validLevels });
  } catch (error) {
    console.error('Error fetching proficiency levels:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch proficiency levels' 
    });
  }
};

export const getValidSemesters = async (req: Request, res: Response) => {
  try {
    const validSemesters = [
      { value: 'FALL', label: 'Fall' },
      { value: 'SPRING', label: 'Spring' },
      { value: 'SUMMER', label: 'Summer' }
    ];
    
    res.json({ success: true, data: validSemesters });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch semesters' 
    });
  }
};

export const getValidYears = async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const validYears = [];
    
    // Generate years from 20 years ago to current year (for course completion)
    for (let i = 20; i >= 0; i--) {
      const year = currentYear - i;
      validYears.push({ value: year.toString(), label: year.toString() });
    }
    
    res.json({ success: true, data: validYears });
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch years' 
    });
  }
}; 