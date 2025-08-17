'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  sendMessage: (event: string, data: any) => void;
  lastMessage: any;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  reconnect: () => void;
  // Forum-specific methods
  joinForum: (universityId: string) => void;
  leaveForum: (universityId: string) => void;
  onNewForumPost: (callback: (post: any) => void) => void;
  onForumPostUpdate: (callback: (data: { postId: string; action: string }) => void) => void;
  onForumVoteUpdate: (callback: (data: { postId: string; voteData: any }) => void) => void;
  onForumError: (callback: (error: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

// Singleton socket instance
let socketInstance: Socket | null = null;
let isInitializing = false;

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  // Initialize socket with singleton pattern
  const initializeSocket = useCallback((token: string | null) => {
    // If we already have a socket with the same token, don't recreate
    if (socketInstance && lastTokenRef.current === token) {
      setSocket(socketInstance);
      return;
    }

    // If we're already initializing, wait
    if (isInitializing) {
      return;
    }

    isInitializing = true;

    // Clean up existing socket if token changed
    if (socketInstance) {
      console.log('Token changed, disconnecting old socket');
      socketInstance.disconnect();
      socketInstance = null;
    }

    if (!token) {
      console.warn('No access token found, socket will not authenticate');
      isInitializing = false;
      return;
    }

    console.log('Initializing new socket connection with token');
    
    // Create new socket instance
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        token: token
      }
    });

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Socket.IO connected with ID:', newSocket.id);
      setIsConnected(true);
      isInitializing = false;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      isInitializing = false;
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setIsConnected(false);
      setIsAuthenticated(false);
      isInitializing = false;
    });

    // Listen for authentication status
    newSocket.on('authStatus', async (data) => {
      console.log('Socket auth status:', data);
      if (data.success) {
        setIsAuthenticated(true);
        console.log('Socket authenticated successfully for user:', data.user);
        
        // Automatically join role-specific room based on user role
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const userRole = user.role?.toLowerCase();
            
            // Track joined rooms to prevent duplicates
            const joinedRooms = new Set<string>();
            
            if (userRole === 'tuto') {
              console.log('Auto-joining tutos room for TUTO user');
              newSocket.emit('joinRoom', { room: 'tutos' });
              joinedRooms.add('tutos');
            } else if (userRole === 'rookie') {
              console.log('Auto-joining rookies room for ROOKIE user');
              newSocket.emit('joinRoom', { room: 'rookies' });
              joinedRooms.add('rookies');
            } else if (userRole === 'both') {
              console.log('Auto-joining both tutos and rookies rooms for BOTH user');
              newSocket.emit('joinRoom', { room: 'tutos' });
              newSocket.emit('joinRoom', { room: 'rookies' });
              joinedRooms.add('tutos');
              joinedRooms.add('rookies');
            }
            
            // Store joined rooms in socket for reference
            (newSocket as any).joinedRooms = joinedRooms;
          } catch (error) {
            console.error('Error parsing user data for room joining:', error);
          }
        }
      } else {
        setIsAuthenticated(false);
        console.error('Socket authentication failed:', data.error);
        
        // Handle token expiry in socket authentication
        if (data.error?.includes('jwt expired') || data.error?.includes('invalid token')) {
          console.log('Token expired in socket authentication, attempting refresh');
          
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  refreshToken: refreshToken
                }),
              });

              if (response.ok) {
                const data = await response.json();
                
                // Update tokens in localStorage
                localStorage.setItem('accessToken', data.tokens.accessToken);
                localStorage.setItem('refreshToken', data.tokens.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('Token refreshed for socket, reconnecting...');
                
                // Reinitialize socket with new token
                initializeSocket(data.tokens.accessToken);
                return;
              }
            } catch (refreshError) {
              console.error('Token refresh failed for socket:', refreshError);
            }
          }
          
          // If refresh failed, logout
          console.log('Token refresh failed, triggering logout');
          
          // Show toast notification before redirecting
          const event = new CustomEvent('showToast', {
            detail: {
              message: 'Session expired, please log in again',
              type: 'error'
            }
          });
          window.dispatchEvent(event);
          
          // Clear localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // Small delay to ensure toast is shown before redirect
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 1500);
        }
      }
    });

    // Listen for any message and store it as lastMessage
    newSocket.onAny((eventName, ...args) => {
      const message = { event: eventName, data: args[0] };
      setLastMessage(message);
      console.log('Socket.IO message received:', message);
    });

    // Store the socket instance globally
    socketInstance = newSocket;
    lastTokenRef.current = token;
    setSocket(newSocket);
  }, []);

  // Initialize socket on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    initializeSocket(token);

    // Listen for token changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        const newToken = e.newValue;
        if (newToken !== lastTokenRef.current) {
          console.log('Token changed in localStorage, reinitializing socket');
          initializeSocket(newToken);
        }
      }
    };

    // Listen for authentication state changes in the same tab
    const handleAuthChange = () => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken !== lastTokenRef.current) {
        console.log('Authentication state changed, reinitializing socket');
        initializeSocket(currentToken);
      }
    };

    // Listen for custom auth events
    const handleAuthEvent = (e: CustomEvent) => {
      if (e.type === 'authStateChanged') {
        handleAuthChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthEvent as EventListener);

    // Set up a polling mechanism to check for token changes
    const tokenCheckInterval = setInterval(() => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken !== lastTokenRef.current) {
        console.log('Token changed detected via polling, reinitializing socket');
        initializeSocket(currentToken);
      }
    }, 1000); // Check every 1 second for faster response

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthEvent as EventListener);
      clearInterval(tokenCheckInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initializeSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Don't disconnect the global socket instance here as it might be used by other components
    };
  }, []);

  // Global cleanup function for app shutdown
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketInstance) {
        console.log('App shutting down, disconnecting socket');
        socketInstance.disconnect();
        socketInstance = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socket && socket.connected && isAuthenticated) {
      socket.emit(event, data);
    } else {
      console.warn('Socket.IO is not connected or not authenticated');
    }
  }, [socket, isAuthenticated]);

  const joinRoom = useCallback((room: string) => {
    if (socket && socket.connected && isAuthenticated) {
      // Check if already joined to prevent duplicates
      const joinedRooms = (socket as any).joinedRooms as Set<string> | undefined;
      if (joinedRooms && joinedRooms.has(room)) {
        console.log('Already joined room:', room, '- skipping duplicate join');
        return;
      }
      
      socket.emit('joinRoom', { room });
      console.log('Joining room:', room);
      
      // Track the joined room
      if (joinedRooms) {
        joinedRooms.add(room);
      } else {
        (socket as any).joinedRooms = new Set([room]);
      }
    } else {
      console.warn('Cannot join room: socket not connected or not authenticated');
    }
  }, [socket, isAuthenticated]);

  const leaveRoom = useCallback((room: string) => {
    if (socket && socket.connected) {
      socket.emit('leaveRoom', { room });
      console.log('Leaving room:', room);
      
      // Remove from tracked rooms
      const joinedRooms = (socket as any).joinedRooms as Set<string> | undefined;
      if (joinedRooms) {
        joinedRooms.delete(room);
      }
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      initializeSocket(token);
    } else {
      console.warn('Cannot reconnect: no access token found.');
    }
  }, [initializeSocket]);

  // Forum-specific methods
  const joinForum = useCallback((universityId: string) => {
    if (socket && socket.connected && isAuthenticated) {
      socket.emit('joinForum', { universityId });
      console.log('Joining forum for university:', universityId);
    } else {
      console.warn('Cannot join forum: socket not connected or not authenticated');
    }
  }, [socket, isAuthenticated]);

  const leaveForum = useCallback((universityId: string) => {
    if (socket && socket.connected) {
      socket.emit('leaveForum', { universityId });
      console.log('Leaving forum for university:', universityId);
    }
  }, [socket]);

  const onNewForumPost = useCallback((callback: (post: any) => void) => {
    if (socket) {
      socket.on('newForumPost', callback);
      return () => socket.off('newForumPost', callback);
    }
  }, [socket]);

  const onForumPostUpdate = useCallback((callback: (data: { postId: string; action: string }) => void) => {
    if (socket) {
      socket.on('forumPostUpdated', callback);
      return () => socket.off('forumPostUpdated', callback);
    }
  }, [socket]);

  const onForumVoteUpdate = useCallback((callback: (data: { postId: string; voteData: any }) => void) => {
    if (socket) {
      socket.on('forumVoteUpdated', callback);
      return () => socket.off('forumVoteUpdated', callback);
    }
  }, [socket]);

  const onForumError = useCallback((callback: (error: any) => void) => {
    if (socket) {
      socket.on('forumError', callback);
      return () => socket.off('forumError', callback);
    }
  }, [socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    isAuthenticated,
    sendMessage,
    lastMessage,
    joinRoom,
    leaveRoom,
    reconnect,
    joinForum,
    leaveForum,
    onNewForumPost,
    onForumPostUpdate,
    onForumVoteUpdate,
    onForumError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider; 