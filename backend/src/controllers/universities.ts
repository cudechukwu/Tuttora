import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUniversities = async (req: Request, res: Response) => {
  try {
    const universities = await prisma.university.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch universities'
    });
  }
};

export const getUniversityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        courses: true
      }
    });

    if (!university) {
      return res.status(404).json({
        success: false,
        error: 'University not found'
      });
    }

    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch university'
    });
  }
};

export const createUniversity = async (req: Request, res: Response) => {
  try {
    const { name, domain, location } = req.body;

    if (!name || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Name and domain are required'
      });
    }

    const university = await prisma.university.create({
      data: {
        name,
        domain,
        location: location || null
      }
    });

    res.status(201).json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create university'
    });
  }
}; 