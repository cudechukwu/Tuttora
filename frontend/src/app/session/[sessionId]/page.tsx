"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UserGroupIcon, ClockIcon, PauseIcon, PlayIcon, StopIcon, ExclamationTriangleIcon, PencilSquareIcon, ChatBubbleLeftRightIcon, ComputerDesktopIcon, ArrowUpTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSocket } from '@/contexts/SocketContext';
import Chat from '@/components/Chat';
import InteractiveWhiteboard from '@/components/InteractiveWhiteboard';
import FileUpload from '@/components/FileUpload';
import ScreenShare from '@/components/ScreenShare';
import CodeEditor from '@/components/CodeEditor';
import GracePeriodCountdown from '@/components/GracePeriodCountdown';
import VideoCall from '@/components/VideoCall';
import { useSessionAccess } from '@/hooks/useSessionAccess';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import SessionFeedbackModal from '@/components/SessionFeedbackModal';

const tools = [
  { name: 'Whiteboard', icon: PencilSquareIcon },
  { name: 'Code Editor', icon: ChatBubbleLeftRightIcon },
  { name: 'Screen Share', icon: ComputerDesktopIcon },
  { name: 'File Upload', icon: ArrowUpTrayIcon }
];

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [activeTool, setActiveTool] = useState('Whiteboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [isVideoCallVisible, setIsVideoCallVisible] = useState(false);
  const [urlStatus, setUrlStatus] = useState<string | null>(null);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string>('');
  const [feedbackPartnerName, setFeedbackPartnerName] = useState<string>('');
  const [feedbackCourseTitle, setFeedbackCourseTitle] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoCallRef = useRef<any>(null);
  const { socket, joinRoom, leaveRoom, isConnected, isAuthenticated, reconnect } = useSocket();

  // Check for status parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      if (status) {
        setUrlStatus(status);
      }
    }
  }, []);

  // Session access control with enhanced status handling
  const { sessionData, loading: isLoading, error, userRole, hasAccess, isActive, canJoinRoom, sessionStatus } = useSessionAccess(sessionId);

  // Session timer with persistence
  const {
    timerState,
    loading: timerLoading,
    error: timerError,
    startTimer,
    pauseTimer,
    resumeTimer,
    endTimer,
    formatTime,
    progressPercentage,
    isExpired,
    canStart,
    canPause,
    canResume,
    canEnd
  } = useSessionTimer({
    sessionId,
    isSessionActive: isActive,
    userRole: userRole as 'TUTO' | 'ROOKIE'
  });

  // On mount, get user from localStorage and fetch avatar from profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Fetch user's avatar from their profile
        const fetchUserAvatar = async () => {
          try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const profileData = await response.json();
              const avatar = user.role === 'TUTO' 
                ? profileData.tutoProfile?.selectedAvatar 
                : profileData.rookieProfile?.selectedAvatar;
              
              setCurrentUser({
                id: user.id,
                name: user.firstName + ' ' + user.lastName,
                avatar: avatar ? (avatar.startsWith('/images/avatars/') ? avatar : `/images/avatars/${avatar}`) : undefined,
                role: user.role?.toLowerCase() === 'tuto' ? 'tuto' : 'rookie'
              });
            } else {
              // Fallback to user data from localStorage
              setCurrentUser({
                id: user.id,
                name: user.firstName + ' ' + user.lastName,
                avatar: undefined,
                role: user.role?.toLowerCase() === 'tuto' ? 'tuto' : 'rookie'
              });
            }
          } catch (error) {
            console.error('Error fetching user avatar:', error);
            // Fallback to user data from localStorage
            setCurrentUser({
              id: user.id,
              name: user.firstName + ' ' + user.lastName,
              avatar: undefined,
              role: user.role?.toLowerCase() === 'tuto' ? 'tuto' : 'rookie'
            });
          }
        };
        
        fetchUserAvatar();
      }
    }
  }, []);

  // Handle access control
  useEffect(() => {
    if (!isLoading) {
      if (error) {
        // Redirect to dashboard with error
        router.replace('/dashboard?error=' + encodeURIComponent(error));
        return;
      }
      
      if (!hasAccess) {
        router.replace('/dashboard?error=' + encodeURIComponent('You do not have access to this session'));
        return;
      }
    }
  }, [isLoading, error, hasAccess, router]);



  // Responsive: snap sidebar to 100vw on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 900) {
        setSidebarWidth(window.innerWidth);
      } else if (sidebarWidth > 420) {
        setSidebarWidth(420);
      } else if (sidebarWidth < 260) {
        setSidebarWidth(260);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  // Drag logic
  const startResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };
  const stopResize = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
  };
  const handleResize = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    let newWidth = bounds.right - e.clientX;
    newWidth = Math.max(260, Math.min(420, newWidth));
    if (window.innerWidth <= 900) {
      newWidth = window.innerWidth;
    }
    setSidebarWidth(newWidth);
  };
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', stopResize);
    } else {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', stopResize);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing]);



  // Start session function (for rookies) - now uses timer hook
  const startSession = async () => {
    try {
      await startTimer();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // Join session room only if session is active - with robust authentication handling
  useEffect(() => {
    let roomJoined = false;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isAttempting = false; // Track if we're currently attempting to join
    let retryCount = 0; // Track retry attempts
    const MAX_RETRIES = 10; // Maximum number of retries

    const attemptJoinRoom = () => {
      // Prevent recursive calls
      if (isAttempting) {
        return;
      }
      
      if (sessionId && canJoinRoom && isAuthenticated && isConnected) {
        console.log('Joining session room:', `session-${sessionId}`);
        isAttempting = true;
        joinRoom(`session-${sessionId}`);
        roomJoined = true;
        isAttempting = false;
        retryCount = 0; // Reset retry count on success
        
        // Clear any pending reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      } else if (sessionId && canJoinRoom && !isAuthenticated && !isAttempting && retryCount < MAX_RETRIES) {
        // If not authenticated but should be able to join, wait for authentication
        console.log('Waiting for authentication before joining session room...');
        
        // Set up polling to check for authentication
        const checkAuth = () => {
          if (isAttempting || retryCount >= MAX_RETRIES) return; // Prevent multiple attempts
          
          retryCount++;
          const token = localStorage.getItem('accessToken');
          if (token && isConnected) {
            console.log('Authentication detected, attempting to join room...');
            isAttempting = true;
            attemptJoinRoom();
          } else {
            // Check again in 1 second
            reconnectTimeout = setTimeout(checkAuth, 1000);
          }
        };
        
        checkAuth();
      } else if (sessionId && canJoinRoom && !isConnected && !isAttempting && retryCount < MAX_RETRIES) {
        // If not connected but should be able to join, wait for connection
        console.log('Waiting for WebSocket connection before joining session room...');
        
        // Set up polling to check for connection
        const checkConnection = () => {
          if (isAttempting || retryCount >= MAX_RETRIES) return; // Prevent multiple attempts
          
          retryCount++;
          if (isConnected && isAuthenticated) {
            console.log('Connection established, attempting to join room...');
            isAttempting = true;
            attemptJoinRoom();
          } else {
            // Check again in 1 second
            reconnectTimeout = setTimeout(checkConnection, 1000);
          }
        };
        
        checkConnection();
      } else if (retryCount >= MAX_RETRIES) {
        console.log('Maximum retry attempts reached for joining session room');
      }
    };

    // Initial attempt to join room
    attemptJoinRoom();

    // Cleanup function
    return () => {
      if (roomJoined) {
        console.log('Leaving session room:', `session-${sessionId}`);
        leaveRoom(`session-${sessionId}`);
      }
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [sessionId, canJoinRoom, isAuthenticated, isConnected]); // Removed joinRoom and leaveRoom from dependencies

  // Chat handlers - TEMPORARILY DISABLED (static mode)
  const handleSendMessage = (message: string) => {
    console.log('Message would be sent:', message);
    // TODO: Re-enable when backend is ready
  };

  const handleLikeMessage = (messageId: string) => {
    console.log('Message would be liked:', messageId);
    // TODO: Re-enable when backend is ready
  };

  const handleReplyToMessage = (messageId: string, reply: string) => {
    console.log('Reply would be sent:', { messageId, reply });
    // TODO: Re-enable when backend is ready
  };

  // File upload handlers
  const handleFileUpload = (file: any) => {
    // Don't add to state here - let the WebSocket notification handle it
    // This prevents duplicate entries when the same user uploads
    console.log('File uploaded:', file.name);
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
        console.log('File deleted:', fileId);
      } else {
        const error = await response.json();
        alert(`Failed to delete file: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleFileView = async (file: any) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      // Extract filename from the stored URL (remove /api/files/ prefix)
      const filename = file.url.replace('/api/files/', '');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/files/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to view file: ${error.error}`);
        return;
      }

      // Create a blob from the response and open it in a new tab
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Note: We don't revoke the URL immediately as the new tab needs it
      // The browser will clean it up when the tab is closed
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to view file');
    }
  };

  // Screen share handlers
  const handleScreenShareStart = () => {
    setIsScreenSharing(true);
    console.log('Screen sharing started');
  };

  const handleScreenShareStop = () => {
    setIsScreenSharing(false);
    console.log('Screen sharing stopped');
  };

  // Video call handlers - persistent calls
  const handleVideoCallToggle = () => {
    // Once started, video call cannot be closed during session
    if (!isVideoCallVisible) {
      setIsVideoCallVisible(true);
    }
  };

  const handleVideoCallMinimize = () => {
    // Minimize just changes the state, doesn't close
    // The VideoCall component handles its own minimize state
  };

  const handleVideoCallMaximize = () => {
    // Maximize just changes the state, doesn't close
    // The VideoCall component handles its own maximize state
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (rating: number, feedback: string, isAnonymous: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${feedbackSessionId}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, feedback, isAnonymous })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Close modal and show success message
      setShowFeedbackModal(false);
      // You could add a toast notification here
      console.log('Feedback submitted successfully');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // You could add an error toast here
    }
  };

  // Listen for meet button clicks from chat
  useEffect(() => {
    const handleMeetButtonClick = () => {
      setIsVideoCallVisible(true);
    };

    window.addEventListener('startVideoCall', handleMeetButtonClick);
    return () => window.removeEventListener('startVideoCall', handleMeetButtonClick);
  }, []);

  // Fetch session files on mount
  useEffect(() => {
    const fetchSessionFiles = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/files/session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUploadedFiles(result.files);
          }
        } else {
          console.error('Failed to fetch session files:', response.status);
        }
      } catch (error) {
        console.error('Error fetching session files:', error);
      }
    };

    if (sessionId) {
      fetchSessionFiles();
    }
  }, [sessionId]);

  // Listen for sessionStatusChanged websocket event
  useEffect(() => {
    if (!window || !sessionId || !isConnected) return;
    
    const handleSessionStatusChanged = (data: any) => {
      if (data.sessionId === sessionId) {
        // Update session status
        if (data.status === 'IN_PROGRESS') {
          // Update session data with new status
          if (data.session) {
            // This will be handled by useSessionAccess now
          }

          // Start the timer if it's not already running
          if (!timerState.isActive) {
            startTimer();
          }
        } else if (data.status === 'COMPLETED') {
          videoCallRef.current?.leaveCall();
          
          // Update session data with completed status
          if (data.session) {
            // The useSessionAccess hook will handle updating the session data
            // which will trigger a re-render and hide the session controls
          }
          
          // End the timer if it's still running
          if (timerState.isActive) {
            endTimer();
          }
          
          // Show feedback modal for completed session
          if (data.session) {
            const partnerUser = userRole === 'TUTO' ? data.session.rookie : data.session.tuto;
            const partnerName = partnerUser ? `${partnerUser.firstName} ${partnerUser.lastName}` : 'Your partner';
            const courseTitle = data.session.course?.title || 'General';
            
            setFeedbackSessionId(data.session.id);
            setFeedbackPartnerName(partnerName);
            setFeedbackCourseTitle(courseTitle);
            setShowFeedbackModal(true);
          }
        }
      }
    };
    
    // Use the socket from the top-level useSocket call
    if (socket) {
      socket.on('sessionStatusChanged', handleSessionStatusChanged);
      return () => {
        socket.off('sessionStatusChanged', handleSessionStatusChanged);
      };
    }
  }, [sessionId, socket, isConnected, timerState.isActive, startTimer, endTimer]);

  // Handle URL status parameter to immediately show active state
  useEffect(() => {
    if (urlStatus === 'active' && sessionData && !timerState.isActive) {
      // Only start timer if session is in ACCEPTED status (ready to be started)
      if (sessionStatus === 'ACCEPTED') {
        startTimer();
      } else if (sessionStatus === 'IN_PROGRESS') {
        // The timer should already be active, but if not, try to reload timer state
        // This handles cases where the timer state got out of sync
        if (!timerState.isActive) {
          // Force reload timer state
          setTimeout(() => {
            // This will trigger the timer to reload its state
          }, 1000);
        }
      }
    }
  }, [urlStatus, sessionData, timerState.isActive, startTimer, sessionStatus]);

  // Handle session status changes to sync timer state
  useEffect(() => {
    if (sessionStatus === 'IN_PROGRESS' && !timerState.isActive) {
      // The session is active but timer isn't - this indicates a sync issue
      // The timer should automatically reload its state when session becomes active
    }
  }, [sessionStatus, timerState.isActive]);

  // Listen for file upload/delete events
  useEffect(() => {
    if (!window || !sessionId || !isConnected) return;

    const handleFileUploaded = (file: any) => {
      console.log('File uploaded:', file);
      setUploadedFiles(prev => [...prev, file]);
    };

    const handleFileDeleted = (data: any) => {
      console.log('File deleted:', data);
      setUploadedFiles(prev => prev.filter(f => f.id !== data.fileId));
    };

    if (socket) {
      socket.on('fileUploaded', handleFileUploaded);
      socket.on('fileDeleted', handleFileDeleted);

      return () => {
        socket.off('fileUploaded', handleFileUploaded);
        socket.off('fileDeleted', handleFileDeleted);
      };
    }
  }, [sessionId, socket, isConnected]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session access...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !hasAccess) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error || 'You do not have access to this session'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser || !sessionData) {
    return null; // or loading spinner
  }

  // Determine theme based on user role
  const theme = {
    background: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200',
    sidebar: 'bg-white/80 backdrop-blur-md border-gray-200',
    header: 'bg-white/80 backdrop-blur-md border-gray-200',
    toolActive: 'bg-gray-100 text-gray-700',
    toolHover: 'hover:text-gray-500',
    chatPanel: 'bg-gray-50/60 border-gray-200',
    footer: 'bg-white/80 backdrop-blur-md border-gray-200'
  };

  return (
    <div ref={containerRef} className={`h-screen w-full flex ${theme.background} overflow-hidden`}>
      {/* Sidebar for tools */}
      <aside className={`w-20 ${theme.sidebar} border-r flex flex-col items-center py-6 space-y-6 shadow-sm`}>
        {tools.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${activeTool === name ? theme.toolActive : `text-gray-400 ${theme.toolHover}`}`}
            onClick={() => setActiveTool(name)}
            aria-label={name}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{name}</span>
          </button>
        ))}
      </aside>

      {/* Main tool area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className={`flex items-center justify-between px-8 py-4 ${theme.header} border-b shadow-sm`}>
          <div className="flex items-center space-x-4">
            <UserGroupIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-700 font-semibold">
              {sessionData.tuto ? `${sessionData.tuto.firstName} ${sessionData.tuto.lastName}` : 'Tutor'} & {sessionData.rookie ? `${sessionData.rookie.firstName} ${sessionData.rookie.lastName}` : 'Student'}
            </span>
            <span className="text-gray-300">|</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              sessionStatus === 'IN_PROGRESS' ? 'bg-gray-200 text-gray-700' :
              sessionStatus === 'ACCEPTED' ? 'bg-gray-100 text-gray-700' :
              sessionStatus === 'REQUESTED' ? 'bg-gray-50 text-gray-500' :
              sessionStatus === 'COMPLETED' ? 'bg-gray-100 text-gray-400' :
              'bg-gray-100 text-gray-700'
            }`}>
              {sessionStatus === 'IN_PROGRESS' ? 'Active' :
               sessionStatus === 'ACCEPTED' ? 'Waiting for Tuto to Start' :
               sessionStatus === 'REQUESTED' ? 'Requested' :
               sessionStatus === 'COMPLETED' ? 'Completed' :
               sessionStatus}
            </span>
            {timerState.isActive && sessionStatus !== 'COMPLETED' && (
              <>
                <span className="text-gray-300">|</span>
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className={`font-semibold text-gray-700`}>
                  {formatTime(timerState.remainingTime)}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  ({Math.floor(timerState.remainingTime / 60)} min remaining)
                </span>
                {timerState.isPaused && (
                  <span className="text-xs text-yellow-600 ml-2">(Paused)</span>
                )}
              </>
            )}
            {!isConnected && (
              <span className="text-xs text-red-500 ml-2">(Disconnected)</span>
            )}
            {isConnected && !isAuthenticated && (
              <span className="text-xs text-yellow-500 ml-2">(Connecting...)</span>
            )}
            {isConnected && isAuthenticated && (
              <div className="flex items-center space-x-1 ml-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-600">Live</span>
              </div>
            )}
            {isConnected && !isAuthenticated && (
              <button
                onClick={reconnect}
                className="flex items-center space-x-1 ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors"
              >
                <ArrowPathIcon className="w-3 h-3" />
                <span>Reconnect</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Grace Period Countdown (for accepted sessions) */}
            {sessionData?.status === 'ACCEPTED' && sessionData?.gracePeriodEnd && (
              <GracePeriodCountdown 
                gracePeriodEnd={sessionData.gracePeriodEnd}
                className="mr-2"
              />
            )}
            
            {/* Start Session Button (for Tuto when session is accepted) */}
            {canStart && (
              <button 
                onClick={startSession}
                disabled={timerLoading}
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <PlayIcon className="w-4 h-4 mr-2" /> Start Session
              </button>
            )}
            
            {/* Timer controls (only show when session is active and not completed) */}
            {timerState.isActive && sessionStatus !== 'COMPLETED' && (
              <>
                {canPause && (
                  <button 
                    onClick={pauseTimer}
                    className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <PauseIcon className="w-4 h-4 mr-1" /> Pause
                  </button>
                )}
                {canResume && (
                  <button 
                    onClick={resumeTimer}
                    className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <PlayIcon className="w-4 h-4 mr-1" /> Resume
                  </button>
                )}
                {canEnd && (
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to end this session?')) {
                        endTimer();
                        videoCallRef.current?.leaveCall();
                      }
                    }}
                    className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <StopIcon className="w-4 h-4 mr-1" /> End Session
                  </button>
                )}
                <button 
                  onClick={() => {
                    // TODO: Implement report logic
                    console.log('Reporting session...');
                  }}
                  className="flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" /> Report
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex flex-1 min-h-0 h-full">
          {/* Main collaborative tool area */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            <div className="w-full h-full min-w-0">
              {activeTool === 'Whiteboard' ? (
                <InteractiveWhiteboard 
                  theme={{
                    primary: 'text-gray-700',
                    primaryHover: 'hover:text-gray-500',
                    primaryBg: 'bg-gray-100',
                    primaryBgHover: 'hover:bg-gray-50'
                  }}
                  sessionId={sessionId}
                />
              ) : activeTool === 'Code Editor' ? (
                <CodeEditor />
              ) : activeTool === 'File Upload' ? (
                <FileUpload
                  sessionId={sessionId}
                  onFileUpload={handleFileUpload}
                  uploadedFiles={uploadedFiles}
                  onFileDelete={handleFileDelete}
                  onFileView={handleFileView}
                />
              ) : activeTool === 'Screen Share' ? (
                <ScreenShare
                  onShareStart={handleScreenShareStart}
                  onShareStop={handleScreenShareStop}
                  isSharing={isScreenSharing}
                  participants={[
                    sessionData.tuto ? `${sessionData.tuto.firstName} ${sessionData.tuto.lastName}` : 'Tutor',
                    sessionData.rookie ? `${sessionData.rookie.firstName} ${sessionData.rookie.lastName}` : 'Student'
                  ]}
                  sessionId={sessionId}
                  currentUser={currentUser}
                />
              ) : (
                <div className="text-gray-400 text-xl font-semibold">
                  {activeTool} coming soon...
                </div>
              )}
            </div>
          </main>

          {/* Drag handle */}
          <div
            className="w-2 cursor-col-resize bg-transparent hover:bg-gray-200 transition-colors duration-150"
            style={{ zIndex: 20, cursor: isResizing ? 'col-resize' : 'ew-resize' }}
            onMouseDown={startResize}
            aria-label="Resize chat sidebar"
            role="separator"
          />
          {/* Chat panel */}
          <aside
            className={`${theme.chatPanel} border-l-2 flex flex-col overflow-hidden`}
            style={{ width: sidebarWidth, minWidth: 260, maxWidth: 420, transition: 'width 0.15s' }}
          >
            <Chat
              sessionId={sessionId}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onLikeMessage={handleLikeMessage}
              onReplyToMessage={handleReplyToMessage}
              theme={{
                primary: '#6b7280', // gray-600
                primaryHover: '#4b5563', // gray-700
                primaryBg: 'rgba(156, 163, 175, 0.1)', // gray-400/10
                primaryBgHover: 'rgba(156, 163, 175, 0.2)', // gray-400/20
                primaryLight: 'rgba(156, 163, 175, 0.05)'
              }}
              canStartCall={sessionStatus === 'IN_PROGRESS'}
            />
          </aside>
        </div>

        {/* Footer */}
        <footer className={`px-8 py-2 ${theme.footer} border-t flex items-center justify-between text-xs text-gray-400`}>
          <span>Session is being recorded for quality assurance. Recording will only be reviewed if reported.</span>
                      <span>Powered by Tuttora</span>
        </footer>
      </div>

      {/* Video Call Overlay - Persistent */}
      <VideoCall
        ref={videoCallRef}
        sessionId={sessionId}
        isVisible={isVideoCallVisible}
        onToggle={handleVideoCallToggle}
        onMinimize={handleVideoCallMinimize}
        onMaximize={handleVideoCallMaximize}
        theme={{
          primary: '#6b7280', // gray-600
          primaryHover: '#4b5563', // gray-700
          primaryBg: 'rgba(156, 163, 175, 0.1)',
          primaryBgHover: 'rgba(156, 163, 175, 0.2)'
        }}
        participants={[
          {
            name: sessionData.tuto ? `${sessionData.tuto.firstName} ${sessionData.tuto.lastName}` : 'Tutor',
            avatar: null, // fallback, as no avatar field exists
            isActive: sessionStatus === 'IN_PROGRESS',
            isMuted: false,
            role: 'Tutor',
          },
          {
            name: sessionData.rookie ? `${sessionData.rookie.firstName} ${sessionData.rookie.lastName}` : 'Rookie',
            avatar: null, // fallback, as no avatar field exists
            isActive: false,
            isMuted: true, // Demo: rookie muted
            role: 'Rookie',
          }
        ]}
        currentUserName={currentUser?.name || ''}
      />

      {/* Session Feedback Modal */}
      <SessionFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        sessionId={feedbackSessionId}
        partnerName={feedbackPartnerName}
        courseTitle={feedbackCourseTitle}
      />
    </div>
  );
} 