'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuthErrorHandler } from '@/utils/auth';

interface SessionRequest {
  id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_CONFIRMATION';
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
  status: 'ACCEPTED' | 'IN_PROGRESS' | 'PENDING_CONFIRMATION' | 'CANCELLED' | 'EXPIRED_PENDING_REASSIGNMENT';
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

interface RookieSessionContextType {
  // State
  requests: SessionRequest[];
  activeSessions: ActiveSession[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  fetchMyRequests: () => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  withdrawRequest: (sessionId: string) => Promise<void>;
  joinSession: (sessionId: string) => void;
  createRequest: (requestData: any) => Promise<void>;
  
  // Utilities
  getFormattedRequest: (request: SessionRequest) => any;
  addRequest: (request: SessionRequest) => void;
  removeRequest: (requestId: string) => void;
  updateRequest: (requestId: string, updates: Partial<SessionRequest>) => void;
  addActiveSession: (session: ActiveSession) => void;
  removeActiveSession: (sessionId: string) => void;
  updateActiveSession: (sessionId: string, updates: Partial<ActiveSession>) => void;
}

const RookieSessionContext = createContext<RookieSessionContextType | undefined>(undefined);

interface RookieSessionProviderProps {
  children: ReactNode;
  showToast?: (message: string, type: string) => void;
}

export const RookieSessionProvider: React.FC<RookieSessionProviderProps> = ({ 
  children, 
  showToast 
}) => {
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { socket, isConnected, isAuthenticated } = useSocket();
  const { handleApiError } = useAuthErrorHandler();

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

  // Helper function to convert a request to an active session
  const convertRequestToActiveSession = useCallback((request: SessionRequest): ActiveSession => {
    return {
      id: request.id,
      status: request.status as any,
      startTime: request.startTime || new Date().toISOString(),
      notes: request.notes,
      tuto: request.tuto!,
      course: request.course
    };
  }, []);

  const fetchMyRequests = useCallback(async () => {
    try {
      // Check authentication first
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('RookieSessionContext: No token found, skipping fetchMyRequests');
        return;
      }
      
      console.log('RookieSessionContext: Fetching my requests with valid token...');
      setLoading(true);
      setError(null);

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
  }, [showToast, handleApiError]);

  const fetchActiveSessions = useCallback(async () => {
    try {
      // Check authentication first
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('RookieSessionContext: No token found, skipping fetchActiveSessions');
        return;
      }
      
      console.log('RookieSessionContext: Fetching active sessions with valid token...');
      setLoading(true);
      setError(null);

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
  }, [showToast, handleApiError]);

  const fetchData = useCallback(async () => {
    // Double-check authentication before making API calls
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('RookieSessionContext: No token found, skipping data fetch');
      return;
    }
    
    console.log('RookieSessionContext: Fetching data with valid token...');
    await Promise.all([fetchMyRequests(), fetchActiveSessions()]);
  }, [fetchMyRequests, fetchActiveSessions]);

  const withdrawRequest = useCallback(async (sessionId: string) => {
    try {
      // Check authentication first
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('RookieSessionContext: No token found, skipping withdrawRequest');
        return;
      }
      
      setError(null);

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
      
      if (showToast) {
        showToast('Request withdrawn successfully', 'success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw request');
      if (showToast) {
        showToast('Failed to withdraw request', 'error');
      }
    }
  }, [showToast]);

  const joinSession = useCallback(async (sessionId: string) => {
    try {
      // Check authentication first
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('RookieSessionContext: No token found, skipping joinSession');
        return;
      }

      // Find the session to check its status
      const session = [...requests, ...activeSessions].find(s => s.id === sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // If session is PENDING_CONFIRMATION, first accept it
      if (session.status === 'PENDING_CONFIRMATION') {
        const acceptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!acceptResponse.ok) {
          const errorData = await acceptResponse.json();
          throw new Error(errorData.error || 'Failed to accept session');
        }

        console.log('Session accepted successfully');
        if (showToast) {
          showToast('Session accepted successfully!', 'success');
        }
      }

      // If session is ACCEPTED, start it
      if (session.status === 'ACCEPTED' || session.status === 'PENDING_CONFIRMATION') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/start-as-rookie`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start session');
        }

        const result = await response.json();
        console.log('Session started successfully:', result);

        if (showToast) {
          showToast('Session started successfully!', 'success');
        }

        // Wait a moment for the backend to process the status change
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Open session in a new tab with status parameter
      const statusParam = session.status === 'IN_PROGRESS' ? '?status=active' : '';
      window.open(`/session/${sessionId}${statusParam}`, '_blank');
      
    } catch (error) {
      console.error('Error starting session:', error);
      if (showToast) {
        showToast(error instanceof Error ? error.message : 'Failed to start session', 'error');
      }
    }
  }, [requests, activeSessions, showToast]);

  const createRequest = useCallback(async (requestData: any) => {
    try {
      // Check authentication first
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('RookieSessionContext: No token found, skipping createRequest');
        return;
      }
      
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.error || errorData.message || 'Failed to create request');
      }

      const result = await response.json();
      
      console.log('RookieSessionContext: createRequest response:', result);
      
      if (result.request) {
        // Add the new request to the list with duplicate checking
        setRequests(prev => {
          // Check if request already exists
          const exists = prev.find(r => r.id === result.request.id);
          if (exists) {
            return prev;
          }
          return [result.request, ...prev];
        });
        
        if (showToast) {
          showToast('Session request created successfully!', 'success');
        }
      } else {
        console.warn('RookieSessionContext: No request in response:', result);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
      if (showToast) {
        showToast(err instanceof Error ? err.message : 'Failed to create request', 'error');
      }
      throw err;
    }
  }, [showToast]);

  // State manipulation functions
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

  const removeRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const updateRequest = useCallback((requestId: string, updates: Partial<SessionRequest>) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
  }, []);

  const addActiveSession = useCallback((session: ActiveSession) => {
    setActiveSessions(prev => {
      // Check if session already exists
      const exists = prev.find(s => s.id === session.id);
      if (exists) {
        return prev;
      }
      return [session, ...prev];
    });
  }, []);

  const removeActiveSession = useCallback((sessionId: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const updateActiveSession = useCallback((sessionId: string, updates: Partial<ActiveSession>) => {
    setActiveSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  }, []);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !isAuthenticated) {
      console.log('RookieSessionContext: WebSocket not ready for listeners');
      return;
    }

    console.log('RookieSessionContext: Setting up WebSocket listeners');

    // Listen for session request accepted events
    const handleSessionRequestAccepted = (data: any) => {
      console.log('RookieSessionContext: Session request accepted event received:', data);
      
      // This event is triggered when a request is accepted
      // The sessionStatusChanged event will follow with the full session data
      // So we just update the status here and wait for the full data
      updateRequest(data.requestId || data.id, { status: 'PENDING_CONFIRMATION' });
      
      if (showToast) {
        showToast(`Your session request has been accepted! You have 5 minutes to confirm.`, 'success');
      }
    };

    // Listen for session started events
    const handleSessionStarted = (data: any) => {
      console.log('RookieSessionContext: Session started event received:', data);
      
      // Update session status to IN_PROGRESS
      updateActiveSession(data.sessionId, { status: 'IN_PROGRESS' });
      
      if (showToast) {
        showToast(`Session ${data.sessionId} has started!`, 'success');
      }
    };

    // Listen for session status changes
    const handleSessionStatusChanged = (data: any) => {
      console.log('RookieSessionContext: Session status changed event received:', data);
      
      // Update the appropriate session
      if (data.status === 'COMPLETED') {
        removeActiveSession(data.sessionId);
        // Also remove from requests list when session is completed
        removeRequest(data.sessionId);
      } else if (data.status === 'ACCEPTED' || data.status === 'PENDING_CONFIRMATION') {
        // When a request is accepted, we get the full session data
        if (data.session) {
          // Remove from requests and add to active sessions with full data
          removeRequest(data.sessionId);
          addActiveSession(data.session);
          
          if (showToast) {
            showToast(`Session accepted! You can now join the session.`, 'success');
          }
        } else {
          // If we don't have full session data, find the request and convert it
          const request = requests.find(r => r.id === data.sessionId);
          if (request) {
            removeRequest(data.sessionId);
            const activeSession = convertRequestToActiveSession(request);
            activeSession.status = data.status;
            addActiveSession(activeSession);
            
            if (showToast) {
              showToast(`Session accepted! You can now join the session.`, 'success');
            }
          } else {
            // Fallback: just update the request status
            updateRequest(data.sessionId, { status: data.status });
          }
        }
      } else if (data.status === 'IN_PROGRESS') {
        // Update active session status
        updateActiveSession(data.sessionId, { status: data.status });
        
        if (showToast) {
          showToast(`Session has started! You can now begin your tutoring session.`, 'success');
        }
      } else {
        // For other status changes, update both lists
        updateRequest(data.sessionId, { status: data.status });
        updateActiveSession(data.sessionId, { status: data.status });
      }
      
      if (showToast && data.status !== 'ACCEPTED' && data.status !== 'PENDING_CONFIRMATION') {
        showToast(`Session ${data.sessionId} status updated to ${data.status}`, 'info');
      }
    };

    // Note: We don't listen for newSessionRequest here because:
    // 1. The rookie who creates the request gets immediate feedback from the API response
    // 2. The WebSocket event is mainly for tutos to see new requests
    // 3. Listening here would cause duplicates since createRequest already adds the request

    // Listen for session request rejected events
    const handleSessionRequestRejected = (data: any) => {
      console.log('RookieSessionContext: Session request rejected event received:', data);
      
      // Remove the rejected request
      removeRequest(data.requestId || data.id);
      
      if (showToast) {
        showToast(`Your session request was rejected`, 'error');
      }
    };

    // Listen for grace period expiration events
    const handleGracePeriodExpired = (data: any) => {
      console.log('RookieSessionContext: Grace period expired event received:', data);
      
      // Update session status to CANCELLED
      updateActiveSession(data.sessionId, { status: 'CANCELLED' });
      
      if (showToast) {
        showToast(`Session expired - Tuto didn't start within 5 minutes`, 'error');
      }
    };

    // Add event listeners
    socket.on('sessionRequestAccepted', handleSessionRequestAccepted);
    socket.on('sessionStarted', handleSessionStarted);
    socket.on('sessionStatusChanged', handleSessionStatusChanged);
    socket.on('sessionRequestRejected', handleSessionRequestRejected);
    socket.on('gracePeriodExpired', handleGracePeriodExpired);

    console.log('RookieSessionContext: WebSocket listeners set up successfully');

    // Cleanup event listeners
    return () => {
      console.log('RookieSessionContext: Cleaning up WebSocket listeners');
      socket.off('sessionRequestAccepted', handleSessionRequestAccepted);
      socket.off('sessionStarted', handleSessionStarted);
      socket.off('sessionStatusChanged', handleSessionStatusChanged);
      socket.off('sessionRequestRejected', handleSessionRequestRejected);
    };
  }, [socket, isConnected, isAuthenticated, updateRequest, addActiveSession, removeRequest, updateActiveSession, removeActiveSession, showToast, requests, convertRequestToActiveSession]);

  // Initial data fetch - only run when authenticated
  useEffect(() => {
    // Only fetch data when we have a valid token and are authenticated
    const token = localStorage.getItem('accessToken');
    if (token && isAuthenticated) {
      console.log('RookieSessionContext: Authentication ready, fetching initial data...');
      fetchData();
    } else {
      console.log('RookieSessionContext: Waiting for authentication before fetching data...');
    }
  }, [isAuthenticated, fetchData]); // Wait for authentication to be ready

  const value: RookieSessionContextType = {
    // State
    requests,
    activeSessions,
    loading,
    error,
    
    // Actions
    fetchData,
    fetchMyRequests,
    fetchActiveSessions,
    withdrawRequest,
    joinSession,
    createRequest,
    
    // Utilities
    getFormattedRequest,
    addRequest,
    removeRequest,
    updateRequest,
    addActiveSession,
    removeActiveSession,
    updateActiveSession,
  };

  return (
    <RookieSessionContext.Provider value={value}>
      {children}
    </RookieSessionContext.Provider>
  );
};

export const useRookieSessionContext = () => {
  const context = useContext(RookieSessionContext);
  if (context === undefined) {
    throw new Error('useRookieSessionContext must be used within a RookieSessionProvider');
  }
  return context;
}; 