import { useState, useEffect, useCallback } from 'react';

export interface TutoActiveSession {
  id: string;
  status: 'ACCEPTED' | 'IN_PROGRESS';
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  rookie: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
    department: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const useTutoActiveSessions = () => {
  const [activeSessions, setActiveSessions] = useState<TutoActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/tuto-active-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active sessions');
      }

      const data = await response.json();
      setActiveSessions(data.activeSessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching active sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const refetch = () => {
    fetchActiveSessions();
  };

  return {
    activeSessions,
    loading,
    error,
    refetch
  };
}; 