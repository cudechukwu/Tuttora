import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuthErrorHandler } from '@/utils/auth';

interface SessionRequest {
  id: string;
  status: string;
  notes: string;
  urgency: string;
  createdAt: string;
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
}

interface UseSessionRequestsReturn {
  requests: SessionRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addRequest: (request: SessionRequest) => void;
  removeRequest: (requestId: string) => void;
}

export const useSessionRequests = (showToast?: (message: string, type: string) => void): UseSessionRequestsReturn => {
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { handleApiError } = useAuthErrorHandler();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5001/api/sessions/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
  }, []);

  // Add a new request to the list (for real-time updates)
  const addRequest = useCallback((request: SessionRequest) => {
    setRequests(prev => {
      // Check if request already exists
      const exists = prev.find(r => r.id === request.id);
      if (exists) {
        return prev;
      }
      return [request, ...prev];
    });
  }, []);

  // Remove a request from the list (for real-time updates)
  const removeRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new session requests
    const handleNewRequest = (request: SessionRequest) => {
      console.log('New session request received:', request);
      addRequest(request);
    };

    // Listen for rejected session requests
    const handleRequestRejected = (data: { id: string; tutoId: string }) => {
      console.log('Session request rejected:', data);
      // Only remove if it's the current user who rejected it
      const currentUserId = localStorage.getItem('userId');
      if (data.tutoId === currentUserId) {
        removeRequest(data.id);
      }
    };

    // Listen for accepted session requests
    const handleRequestAccepted = (data: { requestId: string }) => {
      console.log('Session request accepted:', data);
      removeRequest(data.requestId);
    };

    // Note: Authentication is handled automatically via handshake.auth.token
    // No need to manually emit 'authenticate' event

    // Set up event listeners
    socket.on('newSessionRequest', handleNewRequest);
    socket.on('sessionRequestRejected', handleRequestRejected);
    socket.on('sessionRequestAccepted', handleRequestAccepted);

    // Cleanup function
    return () => {
      socket.off('newSessionRequest', handleNewRequest);
      socket.off('sessionRequestRejected', handleRequestRejected);
      socket.off('sessionRequestAccepted', handleRequestAccepted);
    };
  }, [socket, addRequest, removeRequest]);

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    addRequest,
    removeRequest
  };
}; 