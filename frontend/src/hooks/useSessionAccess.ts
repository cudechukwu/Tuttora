import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface SessionData {
  id: string;
  tutoId: string;
  rookieId: string;
  status: string;
  startTime: string;
  endTime?: string;
  acceptedAt?: string;
  gracePeriodEnd?: string;
  course?: {
    id: string;
    title: string;
  };
  tuto?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  rookie?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

interface UseSessionAccessReturn {
  sessionData: SessionData | null;
  loading: boolean;
  error: string | null;
  userRole: 'TUTO' | 'ROOKIE' | null;
  hasAccess: boolean;
  isActive: boolean;
  canJoinRoom: boolean;
  sessionStatus: string;
}

export const useSessionAccess = (sessionId: string): UseSessionAccessReturn => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'TUTO' | 'ROOKIE' | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [canJoinRoom, setCanJoinRoom] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('');
  
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    const validateSessionAccess = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const token = localStorage.getItem('accessToken');

        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        // Validate session access
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/validate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            setError('You do not have access to this session');
          } else if (response.status === 404) {
            setError('Session not found');
          } else {
            setError('Failed to validate session access');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSessionData(data.session);
        setUserRole(data.userRole);
        setHasAccess(data.hasAccess);
        setIsActive(data.isActive);
        setCanJoinRoom(data.canJoinRoom);
        setSessionStatus(data.sessionStatus);

      } catch (err) {
        console.error('Session access validation error:', err);
        setError('Failed to validate session access');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      validateSessionAccess();
    }
  }, [sessionId]);

  // Listen for real-time session status updates
  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;

    const handleSessionStatusChanged = (data: any) => {
      if (data.sessionId === sessionId && data.session) {
        // Update session data with the new data from the WebSocket event
        setSessionData(data.session);
        setSessionStatus(data.session.status);
        setIsActive(data.session.status === 'IN_PROGRESS');
        setCanJoinRoom(data.session.status === 'IN_PROGRESS' || data.session.status === 'ACCEPTED');
      }
    };

    socket.on('sessionStatusChanged', handleSessionStatusChanged);

    return () => {
      socket.off('sessionStatusChanged', handleSessionStatusChanged);
    };
  }, [socket, isConnected, sessionId]);

  // Refresh session data if needed (for cases where page loads immediately after session start)
  useEffect(() => {
    if (sessionData && sessionStatus === 'ACCEPTED' && !isActive) {
      // If session is accepted but not showing as active, refresh the data
      const refreshSessionData = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) return;

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/validate`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setSessionData(data.session);
            setSessionStatus(data.sessionStatus);
            setIsActive(data.isActive);
            setCanJoinRoom(data.canJoinRoom);
          }
        } catch (error) {
          console.error('Error refreshing session data:', error);
        }
      };

      // Wait a bit and then refresh
      const timeoutId = setTimeout(refreshSessionData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [sessionData, sessionStatus, isActive, sessionId]);

  return {
    sessionData,
    loading,
    error,
    userRole,
    hasAccess,
    isActive,
    canJoinRoom,
    sessionStatus
  };
}; 