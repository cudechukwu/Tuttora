import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DashboardStats {
  tpointsBalance: number;
  sessionsCompleted: number;
  averageRating: number;
  activeSessions: number;
  totalEarnings: number;
  totalSpent: number;
  tutoRating: number;
  rookieRating: number;
  totalTutoSessions: number;
  totalRookieSessions: number;
  // Gamification stats
  totalPoints: number;
  currentLevel: number;
  experiencePoints: number;
  currentStreak: number;
  longestStreak: number;
}

export interface SessionRating {
  sessionId: string;
  rating: number | null;
  feedback: string;
  role: 'TUTO' | 'ROOKIE';
  createdAt: Date;
  // Add student info
  studentName?: string;
  courseTitle?: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalTutos: number;
  totalRookies: number;
  totalBothRole: number;
  usersRegisteredToday: number;
  usersRegisteredThisWeek: number;
  usersRegisteredThisMonth: number;
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  totalUniversities: number;
  totalCourses: number;
  registrationTrend: {
    date: string;
    count: number;
  }[];
}

export class DashboardService {
  /**
   * Get admin analytics (total user count and other platform metrics)
   */
  static async getAdminAnalytics(): Promise<AdminAnalytics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all user counts in parallel
    const [
      totalUsers,
      totalTutos,
      totalRookies,
      totalBothRole,
      usersRegisteredToday,
      usersRegisteredThisWeek,
      usersRegisteredThisMonth,
      totalSessions,
      completedSessions,
      activeSessions,
      totalUniversities,
      totalCourses,
      registrationTrend
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Users by role
      prisma.user.count({ where: { role: 'TUTO' } }),
      prisma.user.count({ where: { role: 'ROOKIE' } }),
      prisma.user.count({ where: { role: 'BOTH' } }),
      
      // Registration counts by time period
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      
      // Session statistics
      prisma.session.count(),
      prisma.session.count({ where: { status: 'COMPLETED' } }),
      prisma.session.count({ where: { status: 'IN_PROGRESS' } }),
      
      // Platform content
      prisma.university.count(),
      prisma.course.count(),
      
      // Registration trend for the last 30 days
      prisma.$queryRaw<{date: Date, count: bigint}[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users 
        WHERE created_at >= NOW() - INTERVAL 30 DAY
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    return {
      totalUsers,
      totalTutos,
      totalRookies,
      totalBothRole,
      usersRegisteredToday,
      usersRegisteredThisWeek,
      usersRegisteredThisMonth,
      totalSessions,
      completedSessions,
      activeSessions,
      totalUniversities,
      totalCourses,
      registrationTrend: registrationTrend.map(row => ({
        date: row.date.toISOString().split('T')[0],
        count: Number(row.count)
      }))
    };
  }

  /**
   * Get comprehensive dashboard stats for a user (OPTIMIZED)
   * Uses precomputed aggregates instead of recalculating from scratch
   */
  static async getUserDashboardStats(userId: string): Promise<DashboardStats> {
    // Get user data with session count, role, and rating stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        sessionCount: true, 
        role: true, 
        averageRating: true,
        totalRatings: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get precomputed stats from UserStats table (O(1) lookup)
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) {
      // Create default stats if they don't exist
      return await this.initializeUserStats(userId);
    }

    // Get active sessions count (separate query but lightweight)
    const activeSessions = await this.getActiveSessionsCount(userId);

    // Calculate role-specific session counts
    const totalTutoSessions = await prisma.session.count({
      where: {
        tutoId: userId,
        status: 'COMPLETED'
      }
    });

    const totalRookieSessions = await prisma.session.count({
      where: {
        rookieId: userId,
        status: 'COMPLETED'
      }
    });

    return {
      tpointsBalance: userStats.tpointsBalance,
      sessionsCompleted: user.sessionCount, // Use the new sessionCount field
      averageRating: user.averageRating, // Use pre-computed average rating
      activeSessions,
      totalEarnings: userStats.totalEarnings,
      totalSpent: userStats.totalSpent,
      tutoRating: userStats.tutoRating,
      rookieRating: userStats.rookieRating,
      totalTutoSessions, // Use calculated value
      totalRookieSessions, // Use calculated value
      totalPoints: userStats.totalPoints,
      currentLevel: userStats.currentLevel,
      experiencePoints: userStats.experiencePoints,
      currentStreak: userStats.currentStreak,
      longestStreak: userStats.longestStreak
    };
  }

  /**
   * Initialize default stats for a new user
   */
  static async initializeUserStats(userId: string): Promise<DashboardStats> {
    const defaultStats = await prisma.userStats.create({
      data: {
        userId,
        tpointsBalance: 100, // Starting balance
        tutoRating: 5.0,
        rookieRating: 5.0,
        averageRating: 5.0
      }
    });

    return {
      tpointsBalance: defaultStats.tpointsBalance,
      sessionsCompleted: 0,
      averageRating: 5.0,
      activeSessions: 0,
      totalEarnings: 0,
      totalSpent: 0,
      tutoRating: 5.0,
      rookieRating: 5.0,
      totalTutoSessions: 0,
      totalRookieSessions: 0,
      totalPoints: 0,
      currentLevel: 1,
      experiencePoints: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  /**
   * Get active sessions count for a user (OPTIMIZED)
   * Uses indexed query for better performance
   * Only counts ACCEPTED and IN_PROGRESS sessions as active
   */
  static async getActiveSessionsCount(userId: string): Promise<number> {
    const activeSessions = await prisma.session.count({
      where: {
        OR: [
          { tutoId: userId },
          { rookieId: userId }
        ],
        status: {
          in: ['ACCEPTED', 'IN_PROGRESS']
        }
      }
    });

    return activeSessions;
  }

  /**
   * Update session statistics when a session is completed (OPTIMIZED)
   * Uses incremental updates instead of recalculating everything
   */
  static async updateSessionStats(sessionId: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tuto: true,
        rookie: true
      }
    });

    if (!session || session.status !== 'COMPLETED') {
      return;
    }

    // Update Tuto stats incrementally (only if tutoId exists)
    if (session.tutoId) {
      await this.updateUserSessionStatsIncremental(session.tutoId, 'TUTO', session.rating || 0, session.duration || 0);
    }

    // Update Rookie stats incrementally
    await this.updateUserSessionStatsIncremental(session.rookieId, 'ROOKIE', session.rating || 0, session.duration || 0);
  }

  /**
   * Update individual user session statistics (OPTIMIZED)
   * Uses incremental updates instead of recalculating from all sessions
   */
  static async updateUserSessionStatsIncremental(
    userId: string, 
    role: 'TUTO' | 'ROOKIE', 
    rating: number, 
    duration: number
  ): Promise<void> {
    // Get current stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) {
      await this.initializeUserStats(userId);
      return;
    }

    // Calculate new values incrementally
    const newCompletedSessions = userStats.completedSessions + 1;
    
    // Update role-specific counts
    const newTutoSessions = role === 'TUTO' ? userStats.totalTutoSessions + 1 : userStats.totalTutoSessions;
    const newRookieSessions = role === 'ROOKIE' ? userStats.totalRookieSessions + 1 : userStats.totalRookieSessions;

    // Calculate new average ratings incrementally
    const newTutoRating = role === 'TUTO' 
      ? ((userStats.tutoRating * userStats.totalTutoSessions) + rating) / newTutoSessions
      : userStats.tutoRating;
    
    const newRookieRating = role === 'ROOKIE'
      ? ((userStats.rookieRating * userStats.totalRookieSessions) + rating) / newRookieSessions
      : userStats.rookieRating;

    // Calculate overall average
    const totalRating = (newTutoRating * newTutoSessions + newRookieRating * newRookieSessions);
    const newAverageRating = totalRating / newCompletedSessions;

    // Update stats in database
    await prisma.userStats.update({
      where: { userId },
      data: {
        completedSessions: newCompletedSessions,
        totalTutoSessions: newTutoSessions,
        totalRookieSessions: newRookieSessions,
        tutoRating: newTutoRating,
        rookieRating: newRookieRating,
        averageRating: newAverageRating,
        // Add Tpoints for session completion
        tpointsBalance: {
          increment: role === 'TUTO' ? 10 : 5 // Tuto gets more points
        },
        totalPoints: {
          increment: role === 'TUTO' ? 10 : 5
        }
      }
    });
  }

  /**
   * Award Tpoints to a user
   */
  static async awardTpoints(userId: string, points: number, reason: string): Promise<void> {
    await prisma.userStats.update({
      where: { userId },
      data: {
        tpointsBalance: {
          increment: points
        }
      }
    });

    // Log the transaction (you might want to create a TpointsTransaction table)
    console.log(`Awarded ${points} Tpoints to user ${userId} for: ${reason}`);
  }

  /**
   * Deduct Tpoints from a user
   */
  static async deductTpoints(userId: string, points: number, reason: string): Promise<boolean> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats || userStats.tpointsBalance < points) {
      return false; // Insufficient balance
    }

    await prisma.userStats.update({
      where: { userId },
      data: {
        tpointsBalance: {
          decrement: points
        }
      }
    });

    console.log(`Deducted ${points} Tpoints from user ${userId} for: ${reason}`);
    return true;
  }

  /**
   * Update earnings/spending when a session is completed
   */
  static async updateFinancialStats(
    tutoId: string, 
    rookieId: string, 
    amount: number
  ): Promise<void> {
    // Update Tuto earnings
    await prisma.userStats.update({
      where: { userId: tutoId },
      data: {
        totalEarnings: {
          increment: amount
        }
      }
    });

    // Update Rookie spending
    await prisma.userStats.update({
      where: { userId: rookieId },
      data: {
        totalSpent: {
          increment: amount
        }
      }
    });
  }

  /**
   * Update user rating when a session is rated
   * Uses incremental average calculation for efficiency
   */
  static async updateUserRating(userId: string, newRating: number): Promise<void> {
    console.log(`🔄 Updating user rating for ${userId} with new rating: ${newRating}`);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { averageRating: true, totalRatings: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { averageRating: oldAvg, totalRatings: oldCount } = user;
    console.log(`📊 Current stats - Average: ${oldAvg}, Count: ${oldCount}`);
    
    // Calculate new average incrementally
    const newCount = oldCount + 1;
    const newAvg = (oldAvg * oldCount + newRating) / newCount;
    console.log(`📈 New stats - Average: ${newAvg.toFixed(2)}, Count: ${newCount}`);

    // Update user with new average and count
    await prisma.user.update({
      where: { id: userId },
      data: {
        averageRating: newAvg,
        totalRatings: newCount
      }
    });
    
    console.log(`✅ User rating updated successfully`);
  }

  /**
   * Get session history with ratings and feedback
   */
  static async getSessionHistory(userId: string, limit: number = 10): Promise<SessionRating[]> {
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { tutoId: userId },
          { rookieId: userId }
        ],
        status: 'COMPLETED'
      },
      select: {
        id: true,
        tutoRating: true,
        tutoFeedback: true,
        tutoAnonymous: true,
        tutoFeedbackHiddenBy: true,
        rookieRating: true,
        rookieFeedback: true,
        rookieAnonymous: true,
        rookieFeedbackHiddenBy: true,
        tutoId: true,
        rookieId: true,
        createdAt: true,
        // Include the other user's info and course
        tuto: {
          select: {
            firstName: true,
            lastName: true,
            tutoProfile: {
              select: {
                selectedAvatar: true
              }
            }
          }
        },
        rookie: {
          select: {
            firstName: true,
            lastName: true,
            rookieProfile: {
              select: {
                selectedAvatar: true
              }
            }
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return sessions
      .filter(session => {
        // Filter out sessions where the current user has hidden the feedback
        const isTuto = session.tutoId === userId;
        if (isTuto) {
          // Tuto is viewing, so filter out if rookie feedback is hidden by tuto
          return session.rookieFeedbackHiddenBy !== userId;
        } else {
          // Rookie is viewing, so filter out if tuto feedback is hidden by rookie
          return session.tutoFeedbackHiddenBy !== userId;
        }
      })
      .map(session => {
        // Determine which user is the current user and which is the other person
        const isTuto = session.tutoId === userId;
        const currentUser = isTuto ? session.tuto : session.rookie;
        const otherUser = isTuto ? session.rookie : session.tuto;
        const courseTitle = session.course?.title || 'General';

        // Get the feedback that the OTHER person gave to the current user
        const rating = isTuto ? session.rookieRating : session.tutoRating;
        const feedback = isTuto ? session.rookieFeedback : session.tutoFeedback;
        const isAnonymous = isTuto ? session.rookieAnonymous : session.tutoAnonymous;

        // Get the avatar from the appropriate profile
        const avatar = isTuto 
          ? session.rookie?.rookieProfile?.selectedAvatar 
          : session.tuto?.tutoProfile?.selectedAvatar;

        return {
          sessionId: session.id,
          rating: rating ?? null,
          feedback: feedback || '',
          role: isTuto ? 'TUTO' : 'ROOKIE',
          createdAt: session.createdAt,
          studentName: isAnonymous ? 'Anonymous' : (otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown Student'),
          courseTitle: courseTitle,
          avatar: avatar || null
        };
      });
  }

  /**
   * Get leaderboard data (for future gamification dropdown)
   */
  static async getLeaderboard(limit: number = 10): Promise<any[]> {
    const leaderboard = await prisma.userStats.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: [
        { totalPoints: 'desc' },
        { completedSessions: 'desc' },
        { averageRating: 'desc' }
      ],
      take: limit
    });

    return leaderboard.map((stat, index) => ({
      rank: index + 1,
      userId: stat.user.id,
      username: stat.user.username,
      firstName: stat.user.firstName,
      lastName: stat.user.lastName,
      role: stat.user.role,
      totalPoints: stat.totalPoints,
      completedSessions: stat.completedSessions,
      averageRating: stat.averageRating,
      currentLevel: stat.currentLevel
    }));
  }
} 