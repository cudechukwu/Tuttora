import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthErrorHandler } from '@/utils/auth';

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
  totalPoints: number;
  currentLevel: number;
  experiencePoints: number;
  currentStreak: number;
  longestStreak: number;
}

export interface SessionRating {
  sessionId: string;
  rating: number;
  feedback: string;
  role: 'TUTO' | 'ROOKIE';
  createdAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  totalPoints: number;
  currentLevel: number;
  averageRating: number;
  completedSessions: number;
}

export const useDashboard = (showToast?: (message: string, type: string) => void) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionRating[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { handleApiError } = useAuthErrorHandler();
  
  // Optimize: Use refs to prevent duplicate requests
  const fetchingRef = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate requests
    if (fetchingRef.current && !forceRefresh) return;
    
    // Check cache
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime.current < CACHE_DURATION && stats) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Single API call for all dashboard data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        const error = {
          status: response.status,
          message: errorData.error || errorData.message || 'Failed to fetch dashboard data'
        };
        
        if (showToast) {
          handleApiError(error, showToast);
        }
        throw new Error(error.message);
      }

      const data = await response.json();
      
      // Update all state from single response
      setStats(data.data.stats);
      setSessionHistory(data.data.recentSessions || []);
      setLeaderboard(data.data.leaderboard || []);
      
      lastFetchTime.current = now;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [stats]);

  const awardTpoints = useCallback(async (points: number, reason: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/dashboard/award-tpoints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to award Tpoints');
      }

      // Refresh dashboard data after awarding points (force refresh to bypass cache)
      await fetchDashboardData(true);
      return true;
    } catch (err) {
      console.error('Error awarding Tpoints:', err);
      return false;
    }
  }, [fetchDashboardData]);

  const deductTpoints = useCallback(async (points: number, reason: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/dashboard/deduct-tpoints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to deduct Tpoints');
      }

      // Refresh dashboard data after deducting points (force refresh to bypass cache)
      await fetchDashboardData(true);
      return true;
    } catch (err) {
      console.error('Error deducting Tpoints:', err);
      return false;
    }
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    sessionHistory,
    leaderboard,
    loading,
    error,
    fetchDashboardData,
    awardTpoints,
    deductTpoints,
  };
}; 