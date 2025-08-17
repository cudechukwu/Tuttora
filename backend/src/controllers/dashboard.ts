import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

// Single endpoint for all dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all dashboard stats in one call
    const dashboardStats = await DashboardService.getUserDashboardStats(userId);
    
    // Get recent session history
    const sessionHistory = await DashboardService.getSessionHistory(userId, 5);
    
    // Get leaderboard data
    const leaderboard = await DashboardService.getLeaderboard(10);

    res.json({
      success: true,
      data: {
        stats: dashboardStats,
        recentSessions: sessionHistory,
        leaderboard: leaderboard
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessionHistory = await DashboardService.getSessionHistory(userId, limit);
    
    res.json({
      success: true,
      data: sessionHistory
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch session history' 
    });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const leaderboard = await DashboardService.getLeaderboard(limit);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leaderboard' 
    });
  }
};

export const awardTpoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { points, reason } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    await DashboardService.awardTpoints(userId, points, reason || 'Manual award');
    
    res.json({
      success: true,
      message: `Awarded ${points} Tpoints successfully`
    });
  } catch (error) {
    console.error('Error awarding Tpoints:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to award Tpoints' 
    });
  }
};

export const deductTpoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { points, reason } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    const success = await DashboardService.deductTpoints(userId, points, reason || 'Manual deduction');
    
    if (!success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient Tpoints balance' 
      });
    }
    
    res.json({
      success: true,
      message: `Deducted ${points} Tpoints successfully`
    });
  } catch (error) {
    console.error('Error deducting Tpoints:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to deduct Tpoints' 
    });
  }
}; 