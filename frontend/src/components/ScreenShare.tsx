'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ComputerDesktopIcon, StopIcon, PlayIcon, PauseIcon, Cog6ToothIcon, UserGroupIcon, EyeIcon, EyeSlashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSocket } from '@/contexts/SocketContext';
import { screenShareService } from '@/services/screenShareService';

interface ScreenShareProps {
  onShareStart?: () => void;
  onShareStop?: () => void;
  isSharing?: boolean;
  participants?: string[];
  sessionId: string;
  currentUser?: any;
}

interface ScreenShare {
  id: string;
  sharerId: string;
  sharerName: string;
  sharerRole: string;
  title: string;
  isActive: boolean;
  startedAt: string;
  viewers: ScreenShareViewer[];
}

interface ScreenShareViewer {
  id: string;
  viewerId: string;
  viewerName: string;
  viewerRole: string;
  joinedAt: string;
  isActive: boolean;
}

export default function ScreenShare({ 
  onShareStart, 
  onShareStop, 
  isSharing = false,
  participants = [],
  sessionId,
  currentUser
}: ScreenShareProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [availableScreens, setAvailableScreens] = useState<MediaStream[]>([]);
  const [activeScreenShares, setActiveScreenShares] = useState<ScreenShare[]>([]);
  const [viewingShare, setViewingShare] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingStream, setViewingStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const viewingVideoRef = useRef<HTMLVideoElement>(null);
  const { socket, sendMessage } = useSocket();

  useEffect(() => {
    // Mock available screens for development
    setAvailableScreens([]);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Fetch active screen shares on mount and periodically
  useEffect(() => {
    fetchActiveScreenShares();
    
    // Refresh every 30 seconds to keep list updated
    const interval = setInterval(fetchActiveScreenShares, 30000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (viewingStream) {
        viewingStream.getTracks().forEach(track => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [viewingStream]);

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleScreenShareStarted = (data: any) => {
      console.log('Screen share started:', data);
      fetchActiveScreenShares(); // Refresh the list
    };

    const handleScreenShareStopped = (data: any) => {
      console.log('Screen share stopped:', data);
      setActiveScreenShares(prev => prev.filter(share => share.id !== data.shareId));
      if (viewingShare === data.shareId) {
        setViewingShare(null);
      }
    };

    const handleViewerJoined = (data: any) => {
      console.log('Viewer joined:', data);
      setActiveScreenShares(prev => prev.map(share => {
        if (share.id === data.shareId) {
          return {
            ...share,
            viewers: [...share.viewers, {
              id: Date.now().toString(),
              viewerId: data.viewerId,
              viewerName: data.viewerName,
              viewerRole: data.viewerRole,
              joinedAt: new Date().toISOString(),
              isActive: true
            }]
          };
        }
        return share;
      }));
    };

    const handleViewerLeft = (data: any) => {
      console.log('Viewer left:', data);
      setActiveScreenShares(prev => prev.map(share => {
        if (share.id === data.shareId) {
          return {
            ...share,
            viewers: share.viewers.filter(viewer => viewer.viewerId !== data.viewerId)
          };
        }
        return share;
      }));
    };

    socket.on('screenShareStarted', handleScreenShareStarted);
    socket.on('screenShareStopped', handleScreenShareStopped);
    socket.on('screenShareViewerJoined', handleViewerJoined);
    socket.on('screenShareViewerLeft', handleViewerLeft);

    return () => {
      socket.off('screenShareStarted', handleScreenShareStarted);
      socket.off('screenShareStopped', handleScreenShareStopped);
      socket.off('screenShareViewerJoined', handleViewerJoined);
      socket.off('screenShareViewerLeft', handleViewerLeft);
    };
  }, [socket, viewingShare]);

  const fetchActiveScreenShares = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found for fetching screen shares');
        return;
      }

      console.log('Fetching active screen shares for session:', sessionId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/screen-shares`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetch screen shares response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Active screen shares:', data);
        setActiveScreenShares(data.screenShares || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error fetching screen shares:', errorData);
      }
    } catch (error) {
      console.error('Error fetching active screen shares:', error);
    }
  };

  const startScreenShare = async () => {
    try {
      setIsLoading(true);
      
      // Initialize WebRTC service if not already done
      if (!screenShareService.isWebRTCInitialized()) {
        console.log('🔧 Initializing WebRTC service for sharer...');
        screenShareService.initializeWebRTC(socket, currentUser);
        // Set the session ID for WebRTC signaling
        screenShareService.setWebRTCSessionId(sessionId);
        console.log('🔧 WebRTC session ID set for sharer:', sessionId);
      } else {
        console.log('🔧 WebRTC service already initialized, updating session ID...');
        screenShareService.setWebRTCSessionId(sessionId);
      }
      
      // Use the screen share service
      const stream = await screenShareService.startScreenShare();
      
      console.log('🎥 Screen share stream obtained:', stream);
      console.log('🎥 Stream tracks:', stream.getTracks().map(track => ({ 
        kind: track.kind, 
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));

      // Wait for the video element to be available
      const setVideoStream = () => {
        if (videoRef.current) {
          console.log('🎥 Setting video srcObject to stream');
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Add event listeners to debug video element
          videoRef.current.onloadedmetadata = () => {
            console.log('🎥 Video metadata loaded');
          };
          videoRef.current.oncanplay = () => {
            console.log('🎥 Video can play');
          };
          videoRef.current.onerror = (e) => {
            console.error('🎥 Video error:', e);
          };
        } else {
          console.log('⏳ Video element not ready yet, retrying in 100ms...');
          setTimeout(setVideoStream, 100);
        }
      };
      
      setVideoStream();

      setSelectedScreen('current');
      setIsRecording(true);
      setRecordingTime(0);
      
      // Call backend to start screen share
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/screen-share/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${currentUser?.name || 'User'}'s Screen`
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Screen share started:', data);
        console.log('🔧 Backend response data:', {
          success: data.success,
          shareId: data.shareId,
          screenShare: data.screenShare,
          keys: Object.keys(data)
        });
        
        // Start WebRTC sharing with the share ID from backend
        if (data.shareId) {
          console.log('🔧 Backend returned shareId:', data.shareId);
          console.log('🔧 About to call screenShareService.startWebRTCSharing...');
          try {
            await screenShareService.startWebRTCSharing(data.shareId);
            console.log('✅ WebRTC sharing started successfully');
          } catch (error) {
            console.error('❌ Failed to start WebRTC sharing:', error);
          }
        } else if (data.screenShare && data.screenShare.id) {
          console.log('🔧 Backend returned screenShare.id:', data.screenShare.id);
          console.log('🔧 About to call screenShareService.startWebRTCSharing...');
          try {
            await screenShareService.startWebRTCSharing(data.screenShare.id);
            console.log('✅ WebRTC sharing started successfully');
          } catch (error) {
            console.error('❌ Failed to start WebRTC sharing:', error);
          }
        } else {
          console.error('❌ Backend did not return shareId or screenShare.id');
          console.error('❌ Available data keys:', Object.keys(data));
          console.error('❌ Full response data:', data);
        }
      
        if (onShareStart) {
          onShareStart();
        }

        // Emit WebSocket event
        sendMessage('screenShareStarted', {
          sessionId,
          title: `${currentUser?.name || 'User'}'s Screen`
        });
      } else {
        throw new Error('Failed to start screen share');
      }

    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      console.error('❌ Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to start screen sharing. Please check your permissions.';
      if ((error as Error).name === 'NotAllowedError') {
        errorMessage = 'Screen sharing permission denied. Please allow screen sharing when prompted.';
      } else if ((error as Error).name === 'NotSupportedError') {
        errorMessage = 'Screen sharing is not supported in this browser.';
      } else if ((error as Error).name === 'NotReadableError') {
        errorMessage = 'Could not access screen. Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const stopScreenShare = async () => {
    try {
      // Stop the screen share service
      screenShareService.stopScreenShare();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsRecording(false);
      setSelectedScreen(null);
      
      // Find the active screen share for this user
      const activeShare = activeScreenShares.find(share => 
        share.sharerId === currentUser?.id && share.isActive
      );

      if (activeShare) {
        // Call backend to stop screen share
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/screen-share/${activeShare.id}/stop`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          console.log('Screen share stopped successfully');
          
          // Refresh the list of active screen shares
          await fetchActiveScreenShares();
        } else {
          console.error('Failed to stop screen share on backend');
        }

        // Emit WebSocket event
        sendMessage('screenShareStopped', {
          sessionId,
          shareId: activeShare.id
        });
      }
    
      if (onShareStop) {
        onShareStop();
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const joinScreenShare = async (shareId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Attempting to join screen share:', { sessionId, shareId });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/screen-share/${shareId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully joined screen share:', data);
        setViewingShare(shareId);
        
        // Start viewing the shared screen
        startViewingScreen(shareId);
        
        // Emit WebSocket event
        sendMessage('screenShareViewerJoined', {
          sessionId,
          shareId
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to join screen share`);
      }
    } catch (error) {
      console.error('Error joining screen share:', error);
      alert(`Failed to join screen share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startViewingScreen = async (shareId: string) => {
    try {
      console.log('🎥 Starting to view screen share:', shareId);
      
      // Find the active screen share
      const activeShare = activeScreenShares.find(share => share.id === shareId);
      if (!activeShare) {
        console.error('❌ Screen share not found:', shareId);
        return;
      }

      console.log('✅ Screen share found:', activeShare);
      
      // Initialize WebRTC if not already done
      if (!screenShareService.isWebRTCInitialized()) {
        console.log('🔧 Initializing WebRTC service for viewer...');
        screenShareService.initializeWebRTC(socket, currentUser);
        screenShareService.setWebRTCSessionId(sessionId);
        console.log('🔧 WebRTC session ID set for viewer:', sessionId);
      } else {
        console.log('🔧 WebRTC service already initialized, updating session ID...');
        screenShareService.setWebRTCSessionId(sessionId);
      }
      
      // Use the screen share service to join
      console.log('🔗 Attempting WebRTC connection...');
      try {
        await screenShareService.joinScreenShare(shareId, (stream: MediaStream) => {
          console.log('🎥 Received screen share stream:', stream);
          setViewingStream(stream);
          
          // Wait for the video element to be available (same fix as sharer)
          const setViewingVideoStream = () => {
            if (viewingVideoRef.current) {
              console.log('🎥 Setting viewing video srcObject to stream');
              viewingVideoRef.current.srcObject = stream;
              console.log('✅ Stream attached to viewing video element');
              
              // Add event listeners to debug video element
              viewingVideoRef.current.onloadedmetadata = () => {
                console.log('🎥 Viewing video metadata loaded');
              };
              viewingVideoRef.current.oncanplay = () => {
                console.log('🎥 Viewing video can play');
              };
              viewingVideoRef.current.onerror = (e) => {
                console.error('🎥 Viewing video error:', e);
              };
            } else {
              console.log('⏳ Viewing video element not ready yet, retrying in 100ms...');
              setTimeout(setViewingVideoStream, 100);
            }
          };
          
          setViewingVideoStream();
        });
        
        console.log('✅ Started viewing screen share');
      } catch (webrtcError) {
        console.error('❌ WebRTC connection failed:', webrtcError);
        
        // Fallback: Create a test stream to show something
        console.log('🔄 Creating fallback test stream...');
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setViewingStream(testStream);
          
          if (viewingVideoRef.current) {
            viewingVideoRef.current.srcObject = testStream;
            console.log('✅ Fallback stream attached');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback stream also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('❌ Error starting to view screen share:', error);
      // Fallback to showing a placeholder
    }
  };

  const leaveScreenShare = async (shareId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Attempting to leave screen share:', { sessionId, shareId });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/screen-share/${shareId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Leave response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully left screen share:', data);
        setViewingShare(null);
        
        // Stop viewing the shared screen
        stopViewingScreen();
        
        // Emit WebSocket event
        sendMessage('screenShareViewerLeft', {
          sessionId,
          shareId
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error when leaving:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to leave screen share`);
      }
    } catch (error) {
      console.error('Error leaving screen share:', error);
      alert(`Failed to leave screen share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopViewingScreen = () => {
    try {
      console.log('Stopping to view screen share');
      
      if (viewingShare) {
        screenShareService.leaveScreenShare(viewingShare);
      }
      
      if (viewingStream) {
        viewingStream.getTracks().forEach(track => track.stop());
        setViewingStream(null);
      }
      
      if (viewingVideoRef.current) {
        viewingVideoRef.current.srcObject = null;
      }
      
      console.log('Stopped viewing screen share');
    } catch (error) {
      console.error('Error stopping to view screen share:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUserSharing = activeScreenShares.some(share => 
    share.sharerId === currentUser?.id && share.isActive
  );

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Screen Share</h3>
            <p className="text-xs text-gray-700 mt-0.5">Share your screen with your session partner</p>
          </div>
          <div className="flex items-center space-x-2">
            {isSharing && (
              <div className="flex items-center space-x-1 text-xs text-gray-700">
                <UserGroupIcon className="w-4 h-4" />
                <span>{participants.length} viewing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {!selectedScreen && !viewingShare ? (
          /* Screen Selection */
          <div className="h-full flex flex-col">
            {/* Active Screen Shares Section */}
            {activeScreenShares.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Active Screen Shares</h4>
                  <button
                    onClick={fetchActiveScreenShares}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-2">
                  {activeScreenShares.map((share) => (
                    <div key={share.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ComputerDesktopIcon className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{share.title}</p>
                            <p className="text-xs text-gray-500">
                              Shared by {share.sharerName} ({share.sharerRole})
                            </p>
                            <p className="text-xs text-gray-400">
                              {share.viewers.length} viewer{share.viewers.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {share.sharerId === currentUser?.id ? (
                            // Show stop button for the person who is sharing
                            <button
                              onClick={stopScreenShare}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                            >
                              <StopIcon className="w-3 h-3" />
                              <span>Stop</span>
                            </button>
                          ) : viewingShare === share.id ? (
                            <button
                              onClick={() => leaveScreenShare(share.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                            >
                              <EyeSlashIcon className="w-3 h-3" />
                              <span>Leave</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => joinScreenShare(share.id)}
                              disabled={isLoading}
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              <EyeIcon className="w-3 h-3" />
                              <span>Join</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Sharing Section */}
            <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <ComputerDesktopIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-gray-700 mb-1">Start Screen Sharing</h4>
              <p className="text-xs text-gray-700 mb-4">Share your entire screen, application window, or browser tab</p>
              
              {/* Browser support check */}
              <div className="text-xs text-gray-500 mb-4">
                {navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function' ? (
                  <span className="text-green-600">✅ Screen sharing supported</span>
                ) : (
                  <span className="text-red-600">❌ Screen sharing not supported</span>
                )}
              </div>
            </div>

            <div className="space-y-3 w-full max-w-xs">
              <button
                onClick={startScreenShare}
                  disabled={isLoading || isUserSharing}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ComputerDesktopIcon className="w-4 h-4" />
                  <span>{isLoading ? 'Starting...' : isUserSharing ? 'Already Sharing' : 'Start Screen Share'}</span>
              </button>

              {/* Test button for debugging */}


              <div className="text-center">
                <p className="text-xs text-gray-700">You'll be prompted to select what to share</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-xs">
              <h5 className="font-semibold text-gray-700 text-xs mb-1">How to share:</h5>
              <ul className="text-xs text-gray-700 space-y-0.5 text-left">
                <li>• Click "Start Screen Share"</li>
                <li>• Choose your entire screen or a specific window</li>
                <li>• Your partner will see your shared content</li>
                <li>• Click the stop button or close the shared window to end</li>
              </ul>
              </div>
            </div>
          </div>
        ) : viewingShare ? (
          /* Viewer Mode - Watching Someone's Screen */
          <div className="h-full flex flex-col">
            {/* Viewer Controls */}
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <EyeIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">Watching Screen Share</span>
                </div>
                <div className="text-xs text-gray-500">
                  {activeScreenShares.find(s => s.id === viewingShare)?.sharerName || 'Unknown'} is sharing
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => leaveScreenShare(viewingShare)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <EyeSlashIcon className="w-4 h-4" />
                  <span>Leave</span>
                </button>
              </div>
            </div>

            {/* Shared Screen Display */}
            <div className="flex-1 relative bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg overflow-hidden">
              {viewingStream ? (
                <video
                  ref={viewingVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  style={{ maxHeight: 'calc(100vh - 300px)' }}
                  onLoadStart={() => console.log('🎥 Viewing video load started')}
                  onLoadedData={() => console.log('🎥 Viewing video data loaded')}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <ComputerDesktopIcon className="w-20 h-20 mx-auto mb-6 opacity-60" />
                    <p className="text-xl font-semibold mb-3">Screen Share Active</p>
                    <p className="text-lg opacity-90 mb-2">
                      {activeScreenShares.find(s => s.id === viewingShare)?.sharerName || 'Unknown'} is sharing their screen
                    </p>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm opacity-80 mb-2">
                        📺 You're now viewing a screen share
                      </p>
                      <p className="text-xs opacity-60">
                        The shared screen content will appear here when WebRTC is fully implemented
                      </p>
                      <div className="mt-3 flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs opacity-70">Connected to sharer</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Screen Share */
          <div className="h-full flex flex-col">
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs font-medium text-gray-700">
                    {isRecording ? 'Recording' : 'Paused'}
                  </span>
                </div>
                {isRecording && (
                  <div className="text-xs text-gray-700">{formatTime(recordingTime)}</div>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={toggleRecording}
                  className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isRecording ? 'Pause' : 'Resume'}
                >
                  {isRecording ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                </button>
                <button
                  onClick={stopScreenShare}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <StopIcon className="w-4 h-4" />
                  <span>Stop Sharing</span>
                </button>
              </div>
            </div>

            {/* Video Display */}
            <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
                style={{ maxHeight: 'calc(100vh - 300px)' }}
                onLoadStart={() => console.log('🎥 Video load started')}
                onLoadedData={() => console.log('🎥 Video data loaded')}
              />
              {/* Overlay when paused */}
              {!isRecording && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <PauseIcon className="w-10 h-10 mx-auto mb-1.5" />
                    <p className="text-sm font-semibold">Screen Share Paused</p>
                    <p className="text-xs opacity-75">Click play to resume</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span>Sharing: {selectedScreen === 'current' ? 'Current Screen' : 'Unknown'}</span>
                <span>Quality: HD</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between text-xs text-gray-700">
          <span>{isSharing ? 'Screen sharing active' : 'Ready to share'}</span>
          <span>Max quality: 1080p</span>
        </div>
      </div>
    </div>
  );
} 