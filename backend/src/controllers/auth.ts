import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateTokens, hashPassword, comparePassword, generateUsername, validateEmail, validatePassword } from '../utils/auth';
import { emailNotificationService } from '../services/emailNotificationService';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, universityId, role = 'ROOKIE', selectedCourses = [], selectedDepartments = [] } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !universityId) {
      return res.status(400).json({
        error: 'All fields are required: email, password, firstName, lastName, universityId'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Validate role
    if (role && !['ROOKIE', 'TUTO', 'BOTH'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ROOKIE, TUTO, or BOTH' });
    }

    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId }
    });

    if (!university) {
      return res.status(400).json({ error: 'University not found' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Validate selected courses if provided
    if (selectedCourses && selectedCourses.length > 0) {
      const courseIds = selectedCourses.map((course: any) => course.id || course);
      const validCourses = await prisma.course.findMany({
        where: {
          id: { in: courseIds },
          universityId: universityId
        }
      });

      if (validCourses.length !== courseIds.length) {
        return res.status(400).json({ error: 'Some selected courses are invalid or not available for this university' });
      }
    }

    // Generate unique username
    let username: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      username = generateUsername();
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!existingUsername) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique username' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Prepare user data
    const userData: any = {
      email,
      password: hashedPassword,
      username: username!,
      firstName,
      lastName,
      universityId,
      role
    };

    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
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
                department: true,
                credits: true
              }
            }
          }
        }
      }
    });

    // Handle course and department selections based on role
    if (role === 'ROOKIE' && selectedCourses && selectedCourses.length > 0) {
      // Rookies: Add specific courses they're taking
      const courseIds = selectedCourses.map((course: any) => course.id || course);
      
      await prisma.userCourse.createMany({
        data: courseIds.map((courseId: string) => ({
          userId: user.id,
          courseId: courseId,
          expertiseLevel: 'BEGINNER'
        }))
      });
    } else if (role === 'TUTO') {
      // Tutors: Handle both specific courses and departments
      const courseIds = selectedCourses.map((course: any) => course.id || course);
      
      // Add specific courses if selected
      if (courseIds.length > 0) {
        await prisma.userCourse.createMany({
          data: courseIds.map((courseId: string) => ({
            userId: user.id,
            courseId: courseId,
            expertiseLevel: 'BEGINNER'
          }))
        });
      }

      // Add all courses from selected departments
      if (selectedDepartments && selectedDepartments.length > 0) {
        const departmentCourses = await prisma.course.findMany({
          where: {
            department: { in: selectedDepartments },
            university: {
              name: 'Wesleyan University'
            }
          }
        });

        if (departmentCourses.length > 0) {
          const departmentCourseIds = departmentCourses.map(course => course.id);
          
          // Filter out courses already added as specific selections
          const newCourseIds = departmentCourseIds.filter(id => !courseIds.includes(id));
          
          if (newCourseIds.length > 0) {
            await prisma.userCourse.createMany({
              data: newCourseIds.map((courseId: string) => ({
                userId: user.id,
                courseId: courseId,
                expertiseLevel: 'BEGINNER'
              }))
            });
          }
        }
      }
    }

    // Fetch updated user with courses
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
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
                department: true,
                credits: true
              }
            }
          }
        }
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Send admin notification for new user registration
    try {
      await emailNotificationService.notifyUserRegistration(user.id);
    } catch (emailError) {
      console.error('Failed to send registration notification email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: updatedUser,
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        university: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        university: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    res.json({
      message: 'Token refreshed successfully',
      user,
      tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // In a more complex system, you might want to blacklist the token
  // For now, we'll just return a success message
  res.json({ message: 'Logout successful' });
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isOnline: true,
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
                department: true,
                credits: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true,
      data: user 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markProfileCompleted = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get current user to determine role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        rookieProfileCompleted: true,
        tutoProfileCompleted: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile completion based on role
    let updateData: any = {};
    
    if (user.role === 'ROOKIE') {
      updateData.rookieProfileCompleted = true;
      updateData.profileCompleted = true;
    } else if (user.role === 'TUTO') {
      updateData.tutoProfileCompleted = true;
      updateData.profileCompleted = true;
    } else if (user.role === 'BOTH') {
      // For BOTH role, we need to check if both profiles are completed
      updateData.rookieProfileCompleted = true;
      updateData.tutoProfileCompleted = true;
      updateData.profileCompleted = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        role: true,
        profileCompleted: true,
        rookieProfileCompleted: true,
        tutoProfileCompleted: true
      }
    });

    res.json({
      success: true,
      message: 'Profile marked as completed',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error marking profile as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 