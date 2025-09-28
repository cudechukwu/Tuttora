import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if the authenticated user is an admin
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        isAdmin: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Invalid user credentials'
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
    }

    // Add admin info to request for use in controllers
    (req as any).user = {
      ...(req as any).user,
      isAdmin: true
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify admin access'
    });
  }
};

/**
 * Middleware to check admin status without requiring it (for optional admin features)
 */
export const checkAdminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true }
      });
      
      if (user && (req as any).user) {
        (req as any).user.isAdmin = user.isAdmin;
      }
    }
    
    next();
  } catch (error) {
    console.error('Check admin status error:', error);
    // Don't fail the request, just continue without admin status
    next();
  }
};
