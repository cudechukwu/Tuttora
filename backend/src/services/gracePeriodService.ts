import { PrismaClient, SessionStatus } from '@prisma/client';
import { setSocketService } from '../controllers/sessions';

const prisma = new PrismaClient();

let socketService: any = null;

export const setGracePeriodSocketService = (service: any) => {
  socketService = service;
};

// Check for expired grace periods and handle session reassignment
export const checkGracePeriodExpiration = async () => {
  try {
    const now = new Date();
    
    // Find sessions that have expired grace periods
    const expiredSessions = await prisma.session.findMany({
      where: {
        status: SessionStatus.PENDING_CONFIRMATION,
        gracePeriodEnd: {
          lt: now
        }
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    for (const session of expiredSessions) {
      console.log(`Grace period expired for session ${session.id}`);
      
      // Update session status to expired pending reassignment
      await prisma.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.EXPIRED_PENDING_REASSIGNMENT,
          tutoId: null, // Remove current tutor
          acceptedAt: null,
          gracePeriodEnd: null
        }
      });

      // Notify tutor that session expired
      if (session.tutoId && socketService) {
        socketService.emitToUser(session.tutoId, 'session_expired', {
          sessionId: session.id,
          message: 'Session expired. The student did not confirm in time.'
        });
      }

      // Notify rookie that session expired
      if (socketService) {
        socketService.emitToUser(session.rookieId, 'session_expired', {
          sessionId: session.id,
          message: 'Your session expired. The request will be sent to other qualified tutors.'
        });
      }

      console.log(`Session ${session.id} marked for reassignment`);
    }

    if (expiredSessions.length > 0) {
      console.log(`Processed ${expiredSessions.length} expired grace periods`);
    }

  } catch (error) {
    console.error('Error checking grace period expiration:', error);
  }
};

// Start the grace period service
export const startGracePeriodService = () => {
  console.log('Grace period service started - checking every minute');
  
  // Check every minute
  setInterval(checkGracePeriodExpiration, 60 * 1000);
  
  // Also check immediately on startup
  checkGracePeriodExpiration();
};

// Get remaining time for a session's grace period
export const getGracePeriodRemaining = (gracePeriodEnd: Date | null): number => {
  if (!gracePeriodEnd) return 0;
  
  const now = new Date();
  const remaining = gracePeriodEnd.getTime() - now.getTime();
  
  return Math.max(0, Math.floor(remaining / 1000)); // Return seconds remaining
};

// Check if a session is in grace period
export const isSessionInGracePeriod = (session: any): boolean => {
  if (session.status !== SessionStatus.PENDING_CONFIRMATION) {
    return false;
  }
  
  if (!session.gracePeriodEnd) {
    return false;
  }
  
  return new Date() < session.gracePeriodEnd;
};

// Get grace period status for a session
export const getGracePeriodStatus = (session: any) => {
  if (!isSessionInGracePeriod(session)) {
    return {
      inGracePeriod: false,
      timeRemaining: 0,
      expired: true
    };
  }
  
  const timeRemaining = getGracePeriodRemaining(session.gracePeriodEnd);
  
  return {
    inGracePeriod: true,
    timeRemaining,
    expired: timeRemaining <= 0
  };
}; 