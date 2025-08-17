import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all departments
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.course.groupBy({
      by: ['department'],
      where: {
        university: {
          name: 'Wesleyan University'
        }
      },
      orderBy: {
        department: 'asc'
      }
    });

    const departmentList = departments.map(d => d.department).sort();

    res.json({
      success: true,
      data: departmentList
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
};

// Get courses by department
export const getCoursesByDepartment = async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    const { search } = req.query;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department parameter is required'
      });
    }

    let whereClause: any = {
      department: department,
      university: {
        name: 'Wesleyan University'
      }
    };

    // Add search filter if provided
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { number: { contains: search, mode: 'insensitive' } }
      ];
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        number: true,
        title: true,
        department: true,
        credits: true,
        professor: true,
        term: true
      },
      orderBy: [
        { number: 'asc' },
        { title: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses by department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
};

// Get course by ID
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        number: true,
        title: true,
        department: true,
        credits: true,
        professor: true,
        term: true
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course'
    });
  }
};

// Search courses across all departments
export const searchCourses = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        university: {
          name: 'Wesleyan University'
        },
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        code: true,
        number: true,
        title: true,
        department: true,
        credits: true,
        professor: true,
        term: true
      },
      orderBy: [
        { department: 'asc' },
        { number: 'asc' }
      ],
      take: 50 // Limit results
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search courses'
    });
  }
}; 