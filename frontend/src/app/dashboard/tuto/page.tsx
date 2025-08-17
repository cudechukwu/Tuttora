"use client";

import Link from 'next/link'
import Image from 'next/image'

import { useState, useRef, useEffect } from 'react'
import { useDashboard } from '@/hooks/useDashboard'
import { useUser } from '@/hooks/useUser'
import { useSessionRequests } from '@/hooks/useSessionRequests'
import { useTutoActiveSessions } from '@/hooks/useTutoActiveSessions'
import { formatSessionRequest, sortRequestsByPriority, formatActiveSession } from '@/utils/sessionUtils'
import { useToast } from '@/contexts/ToastContext'
import { useSocket } from '@/contexts/SocketContext'
import RoleSwitchModal from '@/components/RoleSwitchModal'
import AcceptRequestModal from '@/components/AcceptRequestModal'
import ViewAllRequestsModal from '@/components/ViewAllRequestsModal'
import SessionHistoryWithRatings from '@/components/SessionHistoryWithRatings'
import {
  BellIcon,
  HeartIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarIcon,
  PlayCircleIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  UsersIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';



export default function TutoDashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [roleSwitchModalOpen, setRoleSwitchModalOpen] = useState(false)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [viewAllModalOpen, setViewAllModalOpen] = useState(false)
  const [rejectedRequests, setRejectedRequests] = useState<Set<string>>(new Set())
  const [isRejecting, setIsRejecting] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const { showToast } = useToast()
  const { socket, isConnected, isAuthenticated } = useSocket()
  
  // Set last used dashboard preference
  useEffect(() => {
    localStorage.setItem('lastUsedDashboard', 'tuto');
  }, []);
  
  // Create a wrapper function to match the expected signature
  const handleShowToast = (message: string, type: string) => {
    showToast(message, type as 'error' | 'success' | 'info');
  };
  
  const { stats, sessionHistory, loading, error, fetchDashboardData } = useDashboard(handleShowToast)
  const { getUserDisplayName } = useUser()
  const { requests: sessionRequests, loading: requestsLoading, refetch: refetchRequests } = useSessionRequests(handleShowToast)
  const { activeSessions, loading: activeSessionsLoading, error: activeSessionsError, refetch: refetchActiveSessions } = useTutoActiveSessions()

  // Format active sessions for display
  const formattedActiveSessions = activeSessions.map(formatActiveSession)

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !isAuthenticated) {
      console.log('Tuto Dashboard: WebSocket not ready for listeners', { 
        hasSocket: !!socket, 
        isConnected, 
        isAuthenticated 
      });
      return;
    }

    console.log('Tuto Dashboard: Setting up WebSocket listeners');

    // Listen for session started events
    const handleSessionStarted = (data: any) => {
      console.log('Tuto Dashboard: Session started event received:', data);
      // Refresh active sessions to show the new session
      refetchActiveSessions();
      showToast(`Session ${data.sessionId} has started!`, 'success');
    };

    // Listen for session status changes
    const handleSessionStatusChanged = (data: any) => {
      console.log('Tuto Dashboard: Session status changed event received:', data);
      // Refresh active sessions to reflect the status change
      refetchActiveSessions();
      showToast(`Session ${data.sessionId} status updated to ${data.status}`, 'info');
    };

    // Listen for new session requests
    const handleNewSessionRequest = (data: any) => {
      console.log('Tuto Dashboard: New session request event received:', data);
      // Refresh requests to show the new request immediately
      refetchRequests();
      showToast(`New session request from ${data.rookie?.firstName || 'Unknown'}`, 'info');
    };

    // Listen for session request accepted (by another tutor)
    const handleSessionRequestAccepted = (data: any) => {
      console.log('Tuto Dashboard: Session request accepted event received:', data);
      // Remove the accepted request from the list
      refetchRequests();
      showToast(`Session request ${data.requestId} was accepted by another tutor`, 'info');
    };

    // Listen for grace period expiration events
    const handleGracePeriodExpired = (data: any) => {
      console.log('Tuto Dashboard: Grace period expired event received:', data);
      // Refresh active sessions to reflect the cancellation
      refetchActiveSessions();
      showToast(`Session ${data.sessionId} expired - grace period ended`, 'error');
    };

    // Add event listeners
    socket.on('sessionStarted', handleSessionStarted);
    socket.on('sessionStatusChanged', handleSessionStatusChanged);
    socket.on('newSessionRequest', handleNewSessionRequest);
    socket.on('sessionRequestAccepted', handleSessionRequestAccepted);
    socket.on('gracePeriodExpired', handleGracePeriodExpired);

    console.log('Tuto Dashboard: WebSocket listeners set up successfully');

    // Cleanup event listeners
    return () => {
      console.log('Tuto Dashboard: Cleaning up WebSocket listeners');
      socket.off('sessionStarted', handleSessionStarted);
      socket.off('sessionStatusChanged', handleSessionStatusChanged);
      socket.off('newSessionRequest', handleNewSessionRequest);
      socket.off('sessionRequestAccepted', handleSessionRequestAccepted);
    };
  }, [socket, isConnected, isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRoleSwitch = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/profile/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'ROOKIE' })
      });

      if (!response.ok) {
        throw new Error('Failed to switch role');
      }

      const result = await response.json();
      
      if (result.success) {
        // Redirect to rookie dashboard
        window.location.href = '/dashboard/rookie';
      } else {
        throw new Error(result.message || 'Failed to switch role');
      }
    } catch (error) {
      console.error('Error switching role:', error);
      alert('Failed to switch role. Please try again.');
    }
  };

  const handleRequestClick = (request: any) => {
    // If it's a FormattedRequest (from ViewAllRequestsModal), we need to find the original SessionRequest
    if (request.rookieName) {
      // This is a FormattedRequest, find the original SessionRequest
      const originalRequest = sessionRequests.find(r => r.id === request.id);
      if (originalRequest) {
        setSelectedRequest({
          ...originalRequest,
          subject: request.subject,
          description: request.description,
          urgency: request.urgency,
          waitTime: request.waitTime
        });
      }
    } else {
      // This is a SessionRequest, format it for the modal
      const formattedRequest = formatSessionRequest(request);
      setSelectedRequest({
        ...request,
        subject: formattedRequest.subject,
        description: formattedRequest.description,
        urgency: formattedRequest.urgency,
        waitTime: formattedRequest.waitTime
      });
    }
    setAcceptModalOpen(true);
  };

  const handleAcceptRequest = async (requestId: string) => {
    setIsAccepting(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept request');
      }

      const result = await response.json();
      
      // Refresh the requests list
      await refetchRequests();
      
      // Open session interface in a new tab
      window.open(`/session/${result.session.id}`, '_blank');
      
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(`Failed to accept request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectRequest = async (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the request click
    
    // Optimistic update
    setRejectedRequests(prev => new Set(prev).add(requestId));
    setIsRejecting(prev => new Set(prev).add(requestId));

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject request');
      }

      // Show success toast with undo option
      showToast(
        'This request has been hidden from your dashboard.',
        'success',
        () => handleUnrejectRequest(requestId),
        8000 // 8 seconds to allow for undo
      );

    } catch (error) {
      console.error('Error rejecting request:', error);
      
      // Rollback optimistic update
      setRejectedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      
      showToast(
        `Failed to hide request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setIsRejecting(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleUnrejectRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/requests/${requestId}/reject`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore request');
      }

      // Remove from rejected requests
      setRejectedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });

      showToast('Request restored to your dashboard.', 'success');

    } catch (error) {
      console.error('Error unrejecting request:', error);
      showToast(
        `Failed to restore request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  const handleJoinSession = (sessionId: string) => {
    window.open(`/session/${sessionId}`, '_blank');
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/hide-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove feedback');
      }
      
      showToast('Feedback removed from your feed', 'success');
      // Refetch session history to update the list
      fetchDashboardData(true);
    } catch (error) {
      showToast(
        `Failed to remove feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  const formattedRequests = sortRequestsByPriority(sessionRequests)
    .filter(request => !rejectedRequests.has(request.id))
    .map(formatSessionRequest)

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
      {/* Navigation Header */}
      <nav className="bg-cover bg-center border-b border-gray-200 sticky top-0 z-50" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)', height: '3.25rem' }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-13 min-h-[3.25rem]">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                  <Image
                    src="/images/logo/TP_Logo.png"
                    alt="Tuttora Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
              </Link>
              {/* Forum link - visible on all screen sizes */}
              <Link href="/forum" className="text-gray-700 font-medium tracking-tight text-sm hover:text-gray-900 transition-colors">
                Forum
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <span className="text-gray-700 font-medium tracking-tight">Community Mode</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-700 font-normal tracking-tight text-xs md:text-sm">Tuto Dashboard</span>
                <span className="text-gray-400">•</span>
                <Link href="/forum" className="text-gray-400 font-normal tracking-tight text-xs md:text-sm hover:text-gray-600 transition-colors">
                  Forum
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="p-2 text-gray-600 hover:text-purple-600 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200"
                  aria-label="Open profile menu"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
                {/* Dropdown menu here, but without logout */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <ul className="py-2">
                      <li><a href="/profile" className="block px-4 py-2 text-gray-700 font-medium tracking-tight text-xs md:text-sm hover:bg-gray-50">Profile</a></li>
                      <li><a href="#" className="block px-4 py-2 text-gray-700 font-medium tracking-tight text-xs md:text-sm hover:bg-gray-50">Refer a friend</a></li>
                      <li><a href="#" className="block px-4 py-2 text-gray-700 font-medium tracking-tight text-xs md:text-sm hover:bg-gray-50">Settings</a></li>
                      <li><a href="#" className="block px-4 py-2 text-gray-700 font-medium tracking-tight text-xs md:text-sm hover:bg-gray-50">Work in a group</a></li>
                      <li><a href="#" className="block px-4 py-2 text-gray-700 font-medium tracking-tight text-xs md:text-sm hover:bg-gray-50">Help & support</a></li>
                      <li><a href="#" className="block px-4 py-2 text-gray-700 font-medium tracking-tight text-xs md:text-sm hover:bg-gray-50">Billing & subscription</a></li>
                    </ul>
                  </div>
                )}
              </div>
              {/* Add logout icon */}
                        <button 
                className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-full focus:outline-none"
                aria-label="Log out"
                          onClick={() => {
                  localStorage.removeItem('user');
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  window.location.href = '/auth/login';
                }}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-sm md:text-lg lg:text-xl font-medium text-gray-700 tracking-tight">Welcome back, {getUserDisplayName()}!</h1>
          <p className="text-xs md:text-base font-medium text-gray-500 tracking-tight italic font-serif">Ready to help other students? Check available requests or manage your active sessions.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-200/50 shadow-lg animate-pulse min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-2 md:h-3 bg-gray-200 rounded w-16 md:w-20 mb-1"></div>
                    <div className="h-4 md:h-6 bg-gray-200 rounded w-8 md:w-12"></div>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-4 bg-red-50 border border-red-200 rounded-2xl p-3 md:p-4">
              <p className="text-red-600 text-[10px] md:text-xs">Error loading dashboard stats: {error}</p>
            </div>
          ) :
            <>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-200/50 shadow-sm min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-900 mb-0.5">Tpoints Balance</p>
                    <p className="text-sm md:text-lg font-semibold text-black leading-tight">{stats?.totalEarnings || 0}</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <AcademicCapIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-200/50 shadow-sm min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-900 mb-0.5">Sessions Tutored</p>
                    <p className="text-sm md:text-lg font-semibold text-black leading-tight">{stats?.totalTutoSessions || 0}</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-200/50 shadow-sm min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-900 mb-0.5">Average Rating</p>
                    <p className="text-sm md:text-lg font-semibold text-black leading-tight">{stats?.averageRating?.toFixed(1) || '5.0'}</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <StarIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-200/50 shadow-sm min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-900 mb-0.5">Total Tpoints</p>
                    <p className="text-sm md:text-lg font-semibold text-black leading-tight">{stats?.tpointsBalance || 100}</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
                  </div>
                </div>
              </div>
            </>
          }
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-stretch h-full">
          {/* Available Requests */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="flex-1 flex flex-col justify-center items-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 shadow-sm w-full h-full min-h-0">
              <div className="flex-1 w-full flex flex-col">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-2 md:mr-3">
                      <HeartIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
                  </div>
                  <div>
                      <h2 className="text-gray-700 font-medium tracking-tight text-sm md:text-base lg:text-lg">Available Requests</h2>
                      <p className="text-gray-500 text-xs md:text-sm font-medium tracking-tight italic font-serif">Students waiting for help</p>
                  </div>
                </div>
                  <button className="text-gray-600 hover:text-gray-900 transition-colors">
                    <ChevronDownIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
              {/* Dynamic Session Requests */}
                <div className="flex-1 flex flex-col">
                {requestsLoading ? (
                  // Loading skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-lg p-3 md:p-4 animate-pulse mb-2"></div>
                    ))
                ) : formattedRequests.length === 0 ? (
                    <div className="flex flex-col justify-center items-center w-full h-full border-2 border-dotted border-gray-300 rounded-xl p-4 md:p-8">
                      <HeartIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-400 mb-2 md:mb-3" />
                      <p className="text-gray-700 font-medium tracking-tight text-[10px] md:text-xs lg:text-sm mb-1">No requests available</p>
                      <p className="text-gray-500 text-[8px] md:text-xs font-medium tracking-tight italic font-serif">There are currently no students waiting for help. Check back later!</p>
                  </div>
                ) : (
                  formattedRequests.map((request) => (
                      <div 
                        key={request.id}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2 border border-gray-200 shadow-sm mb-2 flex flex-col gap-0.5 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleRequestClick(request)}
                      >
                      <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1 md:space-x-2">
                            <span className="text-gray-700 font-medium tracking-tight text-[10px] md:text-[11px] lg:text-sm">
                              {request.subject}
                            </span>
                            {(request.priority === 'high') && (
                              <span className="text-[8px] md:text-[10px] font-semibold text-red-700 bg-gray-100 border border-red-200 px-1 md:px-2 py-0.5 md:py-1 rounded-full shadow-sm">
                                Help Needed!
                              </span>
                            )}
                            {/* Match Quality Label */}
                            {request.matchLabel && (
                              <span className={`text-[10px] font-semibold bg-gray-100 px-2 py-1 rounded-full shadow-sm border ${
                                request.matchLabel === 'Perfect Match' ? 'text-green-700 border-green-200' :
                                request.matchLabel === 'Excellent Fit' ? 'text-blue-700 border-blue-200' :
                                request.matchLabel === 'Good Match' ? 'text-yellow-700 border-yellow-200' :
                                request.matchLabel === 'Related Topic' ? 'text-purple-700 border-purple-200' :
                                request.matchLabel === 'General Match' ? 'text-gray-700 border-gray-200' :
                                'text-orange-700 border-orange-200'
                              }`}>
                                {request.matchLabel}
                              </span>
                            )}
                    </div>
                    <div className="text-right">
                                <div className={`text-[12px] font-semibold text-gray-600`}>
                              {request.waitTime}
                    </div>
                      <div className="text-[11px] text-gray-500">waiting</div>
                    </div>
                  </div>
                        <p className="text-xs font-normal text-gray-900 mb-0.5">{request.description}</p>
                  <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm md:text-xs font-medium italic font-serif">
                            Keywords: {request.keywords.join(', ')}
                          </span>
                              <span className={`text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full ${request.urgency === 'Not urgent' ? 'text-gray-500 font-medium tracking-tight italic font-serif' : ''}`}>
                            {request.urgency}
                          </span>
                  </div>
                </div>
                  ))
                )}
              </div>
              {/* View All Button */}
              {sessionRequests.length > 5 && (
              <button
                    className="mt-4 w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow transition-all"
                onClick={() => setViewAllModalOpen(true)}
              >
                View All Available Requests
              </button>
              )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 flex flex-col h-full self-stretch">
            {/* Active Sessions */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <h3 className="text-gray-700 font-medium tracking-tight mb-4">Active Sessions ({formattedActiveSessions.length})</h3>
              <div className="max-h-64 overflow-y-auto space-y-3">
              {activeSessionsLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))
              ) : activeSessionsError ? (
                // Error state
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600 text-sm">Error loading active sessions: {activeSessionsError}</p>
                  <button 
                    onClick={refetchActiveSessions}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Try again
                  </button>
                </div>
                             ) : formattedActiveSessions.length === 0 ? (
                 // Empty state
                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                   <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                   <p className="text-gray-500 text-xs font-medium tracking-tight italic font-serif">No active sessions at the moment. Students are waiting for help!</p>
                 </div>
               ) : (
                 // Actual active sessions
                 formattedActiveSessions.map((session) => (
                   <div key={session.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200 hover:border-gray-300 transition-colors">
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center space-x-2">
                         <CheckCircleIcon className="w-4 h-4 text-gray-500" />
                         <span className="text-xs font-medium px-2 py-1 rounded-full text-gray-700 bg-gray-100">
                           {session.status === 'IN_PROGRESS' ? 'In Progress' : 'Accepted'}
                         </span>
                       </div>
                       <button
                         onClick={() => handleJoinSession(session.id)}
                         className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                       >
                         <PlayCircleIcon className="w-3 h-3" />
                         <span>{session.status === 'ACCEPTED' ? 'Start Session' : 'Join Session'}</span>
                       </button>
                     </div>

                     <div className="mb-2">
                       <h4 className="text-xs font-semibold text-gray-900 mb-1">{session.subject}</h4>
                       <p className="text-xs text-gray-700">{session.description}</p>
                     </div>

                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <UserIcon className="w-3 h-3 text-gray-600" />
                         <span className="text-xs text-gray-700">
                           Rookie: {session.rookieName}
                         </span>
                       </div>
                       <span className="text-xs text-gray-500">
                         {session.remainingTime}
                       </span>
                     </div>
                   </div>
                 ))
               )}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center mb-4">
                <CalendarIcon className="w-4 h-4 text-gray-600 mr-2" />
                <h3 className="text-gray-700 font-medium tracking-tight">Calendar</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-800">Scheduled Session</div>
                  <div className="text-xs text-blue-600">Physics - Tomorrow 2:00 PM</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-purple-800">Study Group</div>
                  <div className="text-xs text-purple-600">Friday 4:00 PM</div>
                </div>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200">
                Manage Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <h3 className="text-gray-700 font-medium tracking-tight text-base md:text-lg mb-4">Session History & Ratings</h3>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse mb-2"></div>
              ))
            ) : error ? (
              // Error state
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 text-sm">Error loading recent activity: {error}</p>
                <button 
                  onClick={() => refetchRequests()} // Assuming refetchRequests fetches activity history
                  className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            ) : (
              <SessionHistoryWithRatings 
                sessions={sessionHistory} 
                loading={loading}
                onDelete={handleDeleteSession}
              />
            )}
          </div>
        </div>


      </div>

      {/* Role Switch Modal */}
      <RoleSwitchModal
        isOpen={roleSwitchModalOpen}
        onClose={() => setRoleSwitchModalOpen(false)}
        onConfirm={handleRoleSwitch}
        currentRole="TUTO"
        targetRole="ROOKIE"
        userName={getUserDisplayName()}
      />

      {/* Accept Request Modal */}
      <AcceptRequestModal
        isOpen={acceptModalOpen}
        onClose={() => {
          setAcceptModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onAccept={handleAcceptRequest}
        isAccepting={isAccepting}
        onReject={async (requestId: string) => {
          // Optimistic update
          setRejectedRequests(prev => new Set(prev).add(requestId));
          setIsRejecting(prev => new Set(prev).add(requestId));
          try {
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('No authentication token found');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/requests/${requestId}/reject`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to reject request');
            }
            showToast(
              'This request has been hidden from your dashboard.',
              'success',
              () => handleUnrejectRequest(requestId),
              8000
            );
          } catch (error) {
            setRejectedRequests(prev => {
              const newSet = new Set(prev);
              newSet.delete(requestId);
              return newSet;
            });
            showToast(
              `Failed to hide request: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'error'
            );
          } finally {
            setIsRejecting(prev => {
              const newSet = new Set(prev);
              newSet.delete(requestId);
              return newSet;
            });
          }
        }}
        isRejecting={selectedRequest ? isRejecting.has(selectedRequest.id) : false}
      />

      {/* View All Requests Modal */}
      <ViewAllRequestsModal
        isOpen={viewAllModalOpen}
        onClose={() => setViewAllModalOpen(false)}
        requests={formattedRequests}
        onRequestClick={handleRequestClick}
        onRejectRequest={handleRejectRequest}
        isRejecting={isRejecting}
      />
    </div>
  )
}