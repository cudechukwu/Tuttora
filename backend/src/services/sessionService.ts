import { PrismaClient, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface SessionTimer {
  startTime: Date | null;
  duration: number; // in minutes
  remainingTime: number; // in seconds
  isActive: boolean;
}

export class SessionService {
  // Start or resume a session
  static async startSession(sessionId: string, userId: string, sessionType: 'tutoring' | 'study_group' = 'tutoring') {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Update session status to IN_PROGRESS and set the actual start time
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        startTime: new Date() // Set the actual start time when rookie clicks "Start Session"
      }
    });

    return this.getSessionWithTimer(sessionId);
  }

  // Get session with current timer state
  static async getSessionWithTimer(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          include: { sender: true },
          orderBy: { timestamp: 'asc' }
        },
        rookie: true,
        tuto: true,
        course: true
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Timer logic: Only start counting when session status is IN_PROGRESS
    const timerDuration = 30; // Default 30 minutes
    let startTime = null;
    let remainingTime = timerDuration * 60; // Full duration in seconds
    let isActive = false;

    // Only start the timer if the session is IN_PROGRESS (rookie has clicked "Start Session")
    if (session.status === SessionStatus.IN_PROGRESS && session.startTime) {
      startTime = session.startTime;
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);
      remainingTime = Math.max(0, (timerDuration * 60) - elapsedSeconds);
      isActive = remainingTime > 0;
    }

    return {
      ...session,
      timer: {
        startTime,
        duration: timerDuration,
        remainingTime,
        isActive
      }
    };
  }

  // Save message to session
  static async saveMessage(sessionId: string, senderId: string, content: string, type: string = 'text') {
    return prisma.message.create({
      data: {
        sessionId,
        senderId,
        content,
        type
      },
      include: {
        sender: {
          include: {
            tutoProfile: {
              select: {
                selectedAvatar: true
              }
            },
            rookieProfile: {
              select: {
                selectedAvatar: true
              }
            }
          }
        }
      }
    });
  }

  // Get session messages
  static async getSessionMessages(sessionId: string) {
    return prisma.message.findMany({
      where: { sessionId },
      include: { sender: true },
      orderBy: { timestamp: 'asc' }
    });
  }

  // End session
  static async endSession(sessionId: string) {
    // Get the session first to get user IDs
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { rookieId: true, tutoId: true }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        endTime: new Date()
      }
    });

    // Increment session count for both rookie and tuto
    await prisma.user.update({
      where: { id: session.rookieId },
      data: { sessionCount: { increment: 1 } }
    });

    if (session.tutoId) {
      await prisma.user.update({
        where: { id: session.tutoId },
        data: { sessionCount: { increment: 1 } }
      });
    }

    return updatedSession;
  }

  // Get active sessions for a user
  static async getActiveSessions(userId: string) {
    return prisma.session.findMany({
      where: {
        OR: [
          { rookieId: userId },
          { tutoId: userId }
        ],
        status: SessionStatus.IN_PROGRESS
      },
      include: {
        rookie: true,
        tuto: true,
        course: true
      }
    });
  }
} 