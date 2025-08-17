'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { MicrophoneIcon, VideoCameraIcon, VideoCameraSlashIcon, UserGroupIcon, XMarkIcon, UserIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, SlashIcon, MinusIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';

interface VideoCallParticipant {
  name: string;
  avatar: string | null;
  isActive: boolean;
  isMuted: boolean;
  role: string;
}

interface VideoCallProps {
  sessionId: string;
  isVisible: boolean;
  onToggle: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  theme: {
    primary: string;
    primaryHover: string;
    primaryBg: string;
    primaryBgHover: string;
  };
  participants: VideoCallParticipant[];
  currentUserName: string;
}

const VideoCall = forwardRef<any, VideoCallProps>(({
  sessionId,
  isVisible,
  onToggle,
  onMinimize,
  onMaximize,
  theme,
  participants,
  currentUserName
}, ref) => {
  const [roomUrl, setRoomUrl] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [callFrame, setCallFrame] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  // Add new state for sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusMinimized, setIsFocusMinimized] = useState(false);

  const leaveCall = async () => {
    if (callFrame) {
      try {
        await callFrame.leave();
        setCallFrame(null);
        setIsInCall(false);
        updateBackendCallState('leave');
      } catch (err) {
        console.error('Error leaving call:', err);
      }
    }
  };
  useImperativeHandle(ref, () => ({
    leaveCall
  }));

  // Get session room URL
  const getRoomUrl = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/room`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get room URL')
      }

      const data = await response.json()
      setRoomUrl(data.roomUrl)
      console.log('Room URL received:', data.roomUrl)

    } catch (err: any) {
      setError(err.message)
      console.error('Error getting room:', err)
    } finally {
      setLoading(false)
    }
  }

  // Join the video call
  const joinCall = async () => {
    if (!roomUrl) return

    try {
      setLoading(true)

      // Create Daily call frame
      const newCallFrame = DailyIframe.createFrame(containerRef.current!, {
        iframeStyle: {
          position: 'relative',
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px'
        },
        showLeaveButton: false,
        showFullscreenButton: false,
      })

      // Set up event listeners
      newCallFrame
        .on('joined-meeting', () => {
          console.log('✅ Joined meeting successfully')
          setIsInCall(true)
          setLoading(false)
          updateBackendCallState('join')
        })
        .on('left-meeting', () => {
          console.log('❌ Left meeting')
          setIsInCall(false)
          updateBackendCallState('leave')
        })
        .on('error', (error: any) => {
          console.error('❌ Call error:', error)
          setError('Failed to join call')
          setLoading(false)
        })

      // Join the room
      await newCallFrame.join({ url: roomUrl, userName: currentUserName })
      setCallFrame(newCallFrame)

    } catch (err: any) {
      console.error('❌ Error joining call:', err)
      setError('Failed to join call')
      setLoading(false)
    }
  }

  const updateBackendCallState = async (action: 'join' | 'leave') => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/call-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        console.error('Failed to update call state')
      }
    } catch (err) {
      console.error('Error updating call state:', err)
      // Ignore errors for now
    }
  }

  // Handle minimize/maximize
  const handleMinimize = () => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    // Remove the code that moves to bottom-left
    // if (newMinimized) {
    //   setPosition({ x: 20, y: window.innerHeight - 120 })
    // }
    onMinimize()
  }

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging from header or container
    const target = e.target as HTMLElement
    const isDraggable = target.closest('.video-call-header') || target === e.currentTarget
    
    if (isDraggable) {
      e.preventDefault()
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - (isMinimized ? 320 : 384) // width of component
      const maxY = window.innerHeight - (isMinimized ? 80 : 256) // height of component
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Auto-join when component mounts and room URL is available
  useEffect(() => {
    if (isVisible && !roomUrl) {
      getRoomUrl()
    }
  }, [isVisible])

  useEffect(() => {
    if (roomUrl && !isInCall && !loading) {
      joinCall()
    }
  }, [roomUrl])

  // Remove the hardcoded participants array
  const sessionTitle = 'Tutoring Session'; // TODO: get from props/context
  const timer = '25:00'; // TODO: get from props/context
  const participantCount = participants.length;

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 ${isMinimized ? 'w-80 h-20' : isFocusMinimized ? 'w-96 h-60' : 'w-[600px] h-[400px]'} bg-white rounded-xl shadow-md border border-gray-200 flex flex-col transition-all duration-200`}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        userSelect: isDragging ? 'none' : 'auto',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Sticky Top Bar */}
      <div className={`video-call-header flex items-center justify-between ${isMinimized || isFocusMinimized ? 'px-2 py-1' : 'px-4 py-2'} bg-white/80 rounded-t-xl border-b shadow-sm sticky top-0 z-10 cursor-move`}>
        <div className="flex items-center gap-2">
          <UserGroupIcon className={`${isMinimized || isFocusMinimized ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} />
          <span className={`${isMinimized || isFocusMinimized ? 'text-xs' : 'text-gray-700 font-semibold'}`}>{sessionTitle}</span>
          <span className="text-gray-300">|</span>
          <span className={`${isMinimized || isFocusMinimized ? 'text-xs' : 'text-xs text-gray-500'}`}>{timer}</span>
          <span className="text-gray-300">|</span>
          <span className={`${isMinimized || isFocusMinimized ? 'text-xs' : 'text-xs text-gray-500'}`}>{participantCount} participants</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleMinimize} className="p-1 rounded hover:bg-gray-100 transition" title={isMinimized ? 'Maximize' : 'Minimize'}>
            {isMinimized ? <ArrowsPointingOutIcon className={`${isMinimized || isFocusMinimized ? 'w-4 h-4' : 'w-4 h-4'}`} /> : <ArrowsPointingInIcon className={`${isMinimized || isFocusMinimized ? 'w-4 h-4' : 'w-4 h-4'}`} />}
          </button>
          {/* Focus Minimize button (MinusIcon) - now toggles focus minimize on/off */}
          <button onClick={() => setIsFocusMinimized(v => !v)} className="p-1 rounded hover:bg-gray-100 transition" title="Focus Minimize">
            <MinusIcon className={`${isMinimized || isFocusMinimized ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} />
          </button>
          {/* Restore button removed, since toggle is now on MinusIcon */}
        </div>
      </div>
      {/* Main Video Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Video Container */}
        {isFocusMinimized ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
            <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
              {/* Show only the video container, no overlay or text */}
            </div>
            {/* Watermark */}
            <div className="absolute bottom-2 right-2 opacity-100 pointer-events-none select-none">
              <img src="/images/logo/TP_Logo.png" alt="TuttoPassa Logo" className="w-16 h-8 object-contain" />
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${isMinimized ? 'hidden' : ''} bg-gray-50 relative`}>
            {error ? (
              <div className="flex items-center justify-center h-full text-red-500 text-sm">
                <div className="text-center">
                  <div className="mb-2">❌ {error}</div>
                  <button
                    onClick={getRoomUrl}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-full w-full">
                {/* Removed green loading spinner */}
              </div>
            ) : (
              <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden bg-gray-200" />
            )}
            {/* Watermark */}
            <div className="absolute bottom-2 right-2 opacity-100 pointer-events-none select-none">
              <img src="/images/logo/TP_Logo.png" alt="TuttoPassa Logo" className="w-16 h-8 object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
})

export default VideoCall; 