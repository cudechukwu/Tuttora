import { useState, useEffect } from 'react';
import { useAuthErrorHandler } from '@/utils/auth';

interface SessionRequest {
  id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  notes: string;
  rating?: number;
  feedback?: string;
  tuto?: {
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
}

interface ActiveSession {
  id: string;
  status: 'ACCEPTED' | 'IN_PROGRESS';
  startTime: string;
  notes: string;
  tuto: {
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
}

interface UseRookieSessionsReturn {
  requests: SessionRequest[];
  activeSessions: ActiveSession[];
  loading: boolean;
  error: string | null;
  fetchMyRequests: () => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  withdrawRequest: (sessionId: string) => Promise<void>;
  joinSession: (sessionId: string) => void;
  getFormattedRequest: (request: SessionRequest) => any;
}

export const useRookieSessions = (showToast?: (message: string, type: string) => void): UseRookieSessionsReturn => {
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleApiError } = useAuthErrorHandler();

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
          message: errorData.error || errorData.message || 'Failed to fetch requests'
        };
        
        if (showToast) {
          handleApiError(error, showToast);
        }
        throw new Error(error.message);
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/my-active-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
          message: errorData.error || errorData.message || 'Failed to fetch active sessions'
        };
        
        if (showToast) {
          handleApiError(error, showToast);
        }
        throw new Error(error.message);
      }

      const data = await response.json();
      setActiveSessions(data.activeSessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active sessions');
    } finally {
      setLoading(false);
    }
  };

  const withdrawRequest = async (sessionId: string) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/requests/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw request');
      }

      // Remove the withdrawn request from the list
      setRequests(prev => prev.filter(req => req.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw request');
    }
  };

  const joinSession = (sessionId: string) => {
    // Open session in a new tab
    window.open(`/session/${sessionId}`, '_blank');
  };

  // Parse session notes to extract subject and description
  const parseSessionNotes = (notes: string) => {
    const subjectMatch = notes.match(/Subject: ([^|]+)/);
    const topicMatch = notes.match(/Topic: ([^|]+)/);
    const descriptionMatch = notes.match(/Description: ([^|]+)/);
    const urgencyMatch = notes.match(/Urgency: ([^|]+)/);

    return {
      subject: subjectMatch ? subjectMatch[1].trim() : 'Unknown Subject',
      topic: topicMatch ? topicMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      urgency: urgencyMatch ? urgencyMatch[1].trim() : 'low'
    };
  };

  // Helper function to get formatted request data
  const getFormattedRequest = (request: SessionRequest) => {
    const parsed = parseSessionNotes(request.notes);
    const waitTime = new Date(request.createdAt);
    const now = new Date();
    const diffInMinutes = Math.round((now.getTime() - waitTime.getTime()) / (1000 * 60));
    
    let waitTimeText = '';
    if (diffInMinutes < 1) {
      waitTimeText = 'Just now';
    } else if (diffInMinutes < 60) {
      waitTimeText = `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      waitTimeText = `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      waitTimeText = `${days}d ago`;
    }

    return {
      ...request,
      ...parsed,
      waitTime: waitTimeText,
      priority: parsed.urgency === 'high' ? 'high' : parsed.urgency === 'medium' ? 'medium' : 'low'
    };
  };

  return {
    requests,
    activeSessions,
    loading,
    error,
    fetchMyRequests,
    fetchActiveSessions,
    withdrawRequest,
    joinSession,
    getFormattedRequest
  };
}; 