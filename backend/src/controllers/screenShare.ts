import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import socket service for real-time updates
let socketService: any = null;

// Function to set socket service (called from index.ts)
export const setScreenShareSocketService = (service: any) => {
  socketService = service;
};

// Start a new screen share
export const startScreenShare = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { title } = req.body;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        tutoId: true,
        rookieId: true,
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Determine user role and info
    const isTuto = session.tutoId === userId;
    const user = isTuto ? session.tuto : session.rookie;
    const userRole = isTuto ? 'TUTO' : 'ROOKIE';

    if (!user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    // Check if user is already sharing
    const existingShare = await prisma.screenShare.findFirst({
      where: {
        sessionId,
        sharerId: userId,
        isActive: true
      }
    });

    if (existingShare) {
      return res.status(400).json({
        error: 'You are already sharing your screen'
      });
    }

    // Create new screen share
    const screenShare = await prisma.screenShare.create({
      data: {
        sessionId,
        sharerId: userId,
        sharerName: `${user.firstName} ${user.lastName}`,
        sharerRole: userRole,
        title: title || `${user.firstName}'s Screen`
      },
      include: {
        viewers: true
      }
    });

    // Emit real-time update
    if (socketService) {
      socketService.sendToRoom(`session-${sessionId}`, 'screenShareStarted', {
        shareId: screenShare.id,
        sharerId: screenShare.sharerId,
        sharerName: screenShare.sharerName,
        sharerRole: screenShare.sharerRole,
        title: screenShare.title,
        startedAt: screenShare.startedAt
      });
    }

    res.json({
      success: true,
      screenShare
    });

  } catch (error) {
    console.error('Error starting screen share:', error);
    res.status(500).json({
      error: 'Failed to start screen share'
    });
  }
};

// Stop a screen share
export const stopScreenShare = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, shareId } = req.params;

    // Find the screen share
    const screenShare = await prisma.screenShare.findFirst({
      where: {
        id: shareId,
        sessionId,
        isActive: true
      }
    });

    if (!screenShare) {
      return res.status(404).json({
        error: 'Screen share not found or already stopped'
      });
    }

    // Check if user is the sharer
    if (screenShare.sharerId !== userId) {
      return res.status(403).json({
        error: 'Only the sharer can stop the screen share'
      });
    }

    // Stop the screen share
    const updatedShare = await prisma.screenShare.update({
      where: { id: shareId },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    // Remove all active viewers
    await prisma.screenShareViewer.updateMany({
      where: {
        screenShareId: shareId,
        isActive: true
      },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });

    // Emit real-time update
    if (socketService) {
      socketService.sendToRoom(`session-${sessionId}`, 'screenShareStopped', {
        shareId: screenShare.id,
        sharerId: screenShare.sharerId,
        sharerName: screenShare.sharerName,
        stoppedAt: updatedShare.endedAt
      });
    }

    res.json({
      success: true,
      message: 'Screen share stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping screen share:', error);
    res.status(500).json({
      error: 'Failed to stop screen share'
    });
  }
};

// Join a screen share as a viewer
export const joinScreenShare = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, shareId } = req.params;
    
    console.log('Join screen share request:', { userId, sessionId, shareId });

    // Find the screen share
    const screenShare = await prisma.screenShare.findFirst({
      where: {
        id: shareId,
        sessionId,
        isActive: true
      },
      include: {
        session: {
          select: {
            tutoId: true,
            rookieId: true,
            tuto: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            },
            rookie: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!screenShare) {
      console.log('Screen share not found:', { shareId, sessionId });
      return res.status(404).json({
        error: 'Screen share not found or not active'
      });
    }

    // Check if user is part of this session
    const session = screenShare.session;
    console.log('Session check:', { sessionTutoId: session.tutoId, sessionRookieId: session.rookieId, userId });
    
    if (session.tutoId !== userId && session.rookieId !== userId) {
      console.log('User not authorized for session');
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Allow rejoining - don't block if already viewing
    const existingViewer = await prisma.screenShareViewer.findFirst({
      where: {
        screenShareId: shareId,
        viewerId: userId,
        isActive: true
      }
    });

    if (existingViewer) {
      console.log('User already viewing screen share - allowing rejoin');
      // Don't block, just return success
      return res.json({
        success: true,
        viewer: existingViewer,
        message: 'Already viewing this screen share'
      });
    }

    // Determine user role and info
    const isTuto = session.tutoId === userId;
    const user = isTuto ? session.tuto : session.rookie;
    const userRole = isTuto ? 'TUTO' : 'ROOKIE';

    if (!user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    // Always allow joining - either create new or reactivate existing
    let viewer = await prisma.screenShareViewer.findFirst({
      where: {
        screenShareId: shareId,
        viewerId: userId
      }
    });

    if (viewer) {
      // Reactivate existing viewer (always allow rejoin)
      viewer = await prisma.screenShareViewer.update({
        where: { id: viewer.id },
        data: {
          isActive: true,
          leftAt: null
        }
      });
      console.log('Reactivated existing viewer:', viewer);
    } else {
      // Create new viewer
      viewer = await prisma.screenShareViewer.create({
        data: {
          screenShareId: shareId,
          viewerId: userId,
          viewerName: `${user.firstName} ${user.lastName}`,
          viewerRole: userRole
        }
      });
      console.log('Created new viewer:', viewer);
    }

    console.log('Successfully added viewer:', viewer);

    // Emit real-time update
    if (socketService) {
      socketService.sendToRoom(`session-${sessionId}`, 'screenShareViewerJoined', {
        shareId,
        viewerId: viewer.viewerId,
        viewerName: viewer.viewerName,
        viewerRole: viewer.viewerRole,
        joinedAt: viewer.joinedAt
      });
    }

    res.json({
      success: true,
      viewer
    });

  } catch (error) {
    console.error('Error joining screen share:', error);
    res.status(500).json({
      error: 'Failed to join screen share'
    });
  }
};

// Leave a screen share as a viewer
export const leaveScreenShare = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, shareId } = req.params;

    // Find the viewer
    const viewer = await prisma.screenShareViewer.findFirst({
      where: {
        screenShareId: shareId,
        viewerId: userId,
        isActive: true
      }
    });

    if (!viewer) {
      return res.status(404).json({
        error: 'Viewer not found or already left'
      });
    }

    // Mark viewer as inactive
    await prisma.screenShareViewer.update({
      where: { id: viewer.id },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });

    console.log('Successfully marked viewer as inactive:', {
      viewerId: viewer.viewerId,
      viewerName: viewer.viewerName,
      leftAt: new Date()
    });

    // Emit real-time update
    if (socketService) {
      socketService.sendToRoom(`session-${sessionId}`, 'screenShareViewerLeft', {
        shareId,
        viewerId: viewer.viewerId,
        viewerName: viewer.viewerName,
        leftAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Left screen share successfully'
    });

  } catch (error) {
    console.error('Error leaving screen share:', error);
    res.status(500).json({
      error: 'Failed to leave screen share'
    });
  }
};

// Get all active screen shares for a session
export const getActiveScreenShares = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Check if user has access to this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        tutoId: true,
        rookieId: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Get active screen shares with viewers
    const screenShares = await prisma.screenShare.findMany({
      where: {
        sessionId,
        isActive: true
      },
      include: {
        viewers: {
          where: {
            isActive: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    res.json({
      success: true,
      screenShares
    });

  } catch (error) {
    console.error('Error getting active screen shares:', error);
    res.status(500).json({
      error: 'Failed to get active screen shares'
    });
  }
};

// Get viewers for a specific screen share
export const getScreenShareViewers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, shareId } = req.params;

    // Check if user has access to this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        tutoId: true,
        rookieId: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Get viewers for the screen share
    const viewers = await prisma.screenShareViewer.findMany({
      where: {
        screenShareId: shareId,
        isActive: true
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    res.json({
      success: true,
      viewers
    });

  } catch (error) {
    console.error('Error getting screen share viewers:', error);
    res.status(500).json({
      error: 'Failed to get screen share viewers'
    });
  }
}; 