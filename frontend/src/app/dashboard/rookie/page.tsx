"use client";

import Link from 'next/link'
import Image from 'next/image'
import { 
  Plus,
  CheckCircle,
} from 'lucide-react'
import {
  AcademicCapIcon,
  UsersIcon,
  BellIcon,
  UserIcon,
  ClockIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react'
import { useDashboard } from '@/hooks/useDashboard'
import { useUser } from '@/hooks/useUser'
import { useRookieSubjects } from '@/hooks/useRookieSubjects'
import { useToast } from '@/contexts/ToastContext'

import { useRookieSessionContext } from '@/contexts/RookieSessionContext'
import RoleSwitchModal from '@/components/RoleSwitchModal'

import SessionManagement from '@/components/SessionManagement'
import RookieSessionProviderWrapper from '@/components/RookieSessionProviderWrapper'
import SessionSummaryCard from '@/components/SessionSummaryCard';
import { useSessionSummary } from '@/hooks/useSessionSummary';
import SessionHistoryWithRatings from '@/components/SessionHistoryWithRatings';


export default function RookieDashboard() {
  return (
    <RookieSessionProviderWrapper>
      <RookieDashboardContent />
    </RookieSessionProviderWrapper>
  )
}

function RookieDashboardContent() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [roleSwitchModalOpen, setRoleSwitchModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const { showToast } = useToast()
  
  // Create a wrapper function to match the expected signature
  const handleShowToast = (message: string, type: string) => {
    showToast(message, type as 'error' | 'success' | 'info');
  };
  
  const { stats, sessionHistory, loading, error, fetchDashboardData } = useDashboard(handleShowToast)
  const { getUserDisplayName } = useUser()
  const { subjects: rookieSubjects, loading: subjectsLoading, error: subjectsError } = useRookieSubjects(handleShowToast)
  const { 
    createRequest: createSessionRequest 
  } = useRookieSessionContext()
  
  // Set last used dashboard preference
  useEffect(() => {
    localStorage.setItem('lastUsedDashboard', 'rookie');
  }, []);

  // Form state
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [urgency, setUrgency] = useState<'Not Urgent' | 'Somewhat Urgent' | 'Very Urgent'>('Not Urgent')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isFocused, setIsFocused] = useState<Record<string, boolean>>({})
  const [showSummary, setShowSummary] = useState(true);

  // Form validation
  const isFormValid = selectedSubject && description.trim().length > 10

  // Use dynamic subjects from the hook, fallback to empty array if loading
  const subjects = rookieSubjects?.allSubjects || []
  const urgencyLevels = ['Not Urgent', 'Somewhat Urgent', 'Very Urgent'] as const

  // WebSocket listeners are now handled by the RookieSessionContext
  // No need to duplicate them here

  // Convert frontend urgency to backend format
  const convertUrgencyToBackend = (frontendUrgency: string): 'low' | 'medium' | 'high' => {
    switch (frontendUrgency) {
      case 'Not Urgent': return 'low'
      case 'Somewhat Urgent': return 'medium'
      case 'Very Urgent': return 'high'
      default: return 'low'
    }
  }

  const handleFocus = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: true }))
  }

  const handleBlur = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: false }))
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateRequest = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
      await createSessionRequest({
        subject: selectedSubjectData?.title || selectedSubject,
        topic: '', // We'll add topic field later if needed
        description: description.trim(),
        urgency: convertUrgencyToBackend(urgency),
        courseId: selectedSubjectData?.id || null // Pass the courseId if it's a real course
      })

      setSubmitSuccess(true)
      // Reset form
      setSelectedSubject('')
      setDescription('')
      setUrgency('Not Urgent')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error creating request:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSubmitError(null)
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

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
        body: JSON.stringify({ role: 'TUTO' })
      });

      if (!response.ok) {
        throw new Error('Failed to switch role');
      }

      const result = await response.json();
      
      if (result.success) {
        // Redirect to tuto dashboard
        window.location.href = '/dashboard/tuto';
      } else {
        throw new Error(result.message || 'Failed to switch role');
      }
    } catch (error) {
      console.error('Error switching role:', error);
      alert('Failed to switch role. Please try again.');
    }
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
      fetchDashboardData();
    } catch (error) {
      showToast(
        `Failed to remove feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  // Add logic to get the most recent completed session for summary
  const completedSessions = sessionHistory.filter((s: any) => s.status === 'COMPLETED');
  const mostRecentSession = completedSessions.length > 0 ? completedSessions[0] : null;
  // Get access token from localStorage (client-side only)
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('accessToken'));
    }
  }, []);
  // Use the session summary hook if a session is available
  const sessionId = mostRecentSession?.sessionId;
  useSessionSummary(sessionId || '', token || '');

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
              {/* Forum link - responsive styling */}
              <Link href="/forum" className="text-gray-400 font-normal tracking-tight text-xs md:text-sm hover:text-gray-600 transition-colors">
                Forum
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="p-2 text-gray-600 hover:text-purple-600 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-green-200"
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
          <p className="text-xs md:text-base font-medium text-gray-500 tracking-tight italic font-serif">Ready to get help with your studies? Create a new request or check your active sessions.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-lg animate-pulse min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-4 bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="text-red-600">Error loading dashboard stats: {error}</p>
            </div>
          ) : (
            <>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-200/50 shadow-sm min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-900 mb-0.5">Tpoints Balance</p>
                    <p className="text-sm md:text-lg font-semibold text-black leading-tight">{stats?.tpointsBalance || 100}</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <AcademicCapIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-200/50 shadow-sm min-h-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-900 mb-0.5">Sessions Completed</p>
                    <p className="text-sm md:text-lg font-semibold text-black leading-tight">{stats?.sessionsCompleted || 0}</p>
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
                    <p className="text-[10px] md:text-xs text-gray-900 mb-0.5">Active Sessions</p>
                    <p className="text-sm md:text-lg font-semibold text-black leading-tight">{stats?.activeSessions || 0}</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-start">
          {/* Create New Request */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-2 md:mr-3">
                  <Plus className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
                </div>
                <div>
                  <h2 className="text-gray-700 font-medium tracking-tight text-sm md:text-base lg:text-lg">Create New Request</h2>
                  <p className="text-gray-500 text-xs md:text-sm font-medium tracking-tight italic font-serif">Get help with your studies in 20-minute sessions</p>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                {/* Subject Selection */}
                <div>
                  <label className="block text-[10px] md:text-xs font-semibold text-gray-700 mb-2">What subject do you need help with?</label>
                  {subjectsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-2 md:p-3 text-xs md:text-sm border-2 rounded-lg bg-gray-100 animate-pulse">
                          <div className="h-3 md:h-4 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : subjectsError ? (
                    <div className="text-red-600 text-sm">Error loading subjects: {subjectsError}</div>
                  ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {subjects.map((subject) => (
                      <button
                          key={subject.id}
                        className={`p-2 md:p-3 text-gray-700 font-medium tracking-tight text-[10px] md:text-[11px] lg:text-xs border rounded-lg transition-all duration-300 text-left ${
                            selectedSubject === subject.id
                            ? 'border-gray-600 bg-gray-50 text-black-700 shadow-md'
                            : 'border-gray-200 bg-white/75 hover:border-gray-300 hover:bg-gray-30 hover:shadow-sm'
                        }`}
                          onClick={() => setSelectedSubject(subject.id)}
                      >
                          {subject.displayName}
                      </button>
                    ))}
                  </div>
                  )}
                </div>

                {/* Topic Description */}
                <div>
                  <label className="block text-[10px] md:text-xs font-semibold text-gray-700 mb-2">Describe what you need help with</label>
                  <div className={`relative transition-all duration-300 ${
                    isFocused.description ? 'transform scale-105' : ''
                  }`}>
                    <textarea
                      className={`w-full px-3 py-2 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none text-xs md:text-sm ${
                        isFocused.description 
                          ? 'border-gray-400 bg-white' 
                          : 'border-gray-200 bg-white/80 hover:border-gray-300'
                      }`}
                      rows={4}
                      placeholder="e.g., I'm struggling with calculus derivatives and need help understanding the chain rule..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onFocus={() => handleFocus('description')}
                      onBlur={() => handleBlur('description')}
                    ></textarea>
                  </div>
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-[10px] md:text-xs font-semibold text-gray-700 mb-2">How urgent is this?</label>
                  <div className="flex flex-wrap gap-2 md:space-x-4">
                    {urgencyLevels.map((level) => (
                      <button
                        key={level}
                        className={`px-3 md:px-4 py-1 md:py-2 text-gray-700 font-medium tracking-tight text-[10px] md:text-xs border rounded-lg transition-all duration-300 ${
                          urgency === level
                            ? 'border-gray-500 bg-gray-50 text-gray-700 shadow-md'
                            : 'border-gray-200 bg-white/80 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                        onClick={() => setUrgency(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Success/Error Messages */}
                {submitSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-shake">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-xs text-green-700 font-medium">Request created successfully! Your request is now available for tutos to accept.</div>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div className="text-xs text-red-700 font-medium">Error creating request: {submitError}</div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  className={`w-full px-6 py-4 rounded-lg text-white text-xs font-semibold font-medium tracking-tight transition-colors
                    ${isFormValid && !isSubmitting
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-gray-500 text-gray-500 cursor-not-allowed'}
                  `}
                  onClick={handleCreateRequest}
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-4 border-b-4 border-white mr-2"></div>
                      <span>Creating request...</span>
                    </div>
                  ) : (
                    <span>Create Request</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Session Management + Quick Actions */}
          <div className="flex flex-col w-full max-w-md mx-auto lg:mx-0 h-full">
            {/* Session Management with extended height to match left column */}
            <div className="flex-1 mb-6">
              <SessionManagement 
                onRefresh={fetchDashboardData}
                className="h-full min-h-[400px] max-h-[600px] overflow-y-auto w-full bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm" 
              />
            </div>
            
            {/* Real-time Test Panel */}
            <div className="mb-6">
              {/* RealTimeTestPanel */}
            </div>
            {/* Quick Actions - positioned at bottom */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm w-full">
              <h3 className="text-gray-700 font-medium tracking-tight mb-2">Quick Actions</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <ClockIcon className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-xs text-gray-700 font-medium">View Session History</span>
                </button>
                <button className="w-full flex items-center p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <StarIcon className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-xs text-gray-700 font-medium">Rate Previous Sessions</span>
                </button>
                <button onClick={() => setRoleSwitchModalOpen(true)} className="w-full flex items-center p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <UsersIcon className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-xs text-gray-700 font-medium">Switch to Tuto Mode</span>
                </button>
                <button className="w-full flex items-center p-2 text-left hover:bg-gray-50 rounded-lg transition-colors pb-1">
                  <Cog6ToothIcon className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-xs text-gray-700 font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Session History with Ratings and Feedback */}
        <div className="mt-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <h3 className="text-gray-700 font-medium tracking-tight text-base md:text-lg mb-4">Session History & Ratings</h3>
            {/* Show summary card only if there is at least one completed session and not deleted */}
            {completedSessions.length > 0 && showSummary && (
              <div className="relative mb-4">
                <SessionSummaryCard
                  loading={false}
                  summary={"This is a mock AI-generated summary of your tutoring session. You discussed integration by parts, solved two practice problems, and clarified the difference between definite and indefinite integrals."}
                  actionItems={[
                    { id: '1', text: 'Review integration by parts notes', checked: false },
                    { id: '2', text: 'Complete practice set 3', checked: false },
                    { id: '3', text: 'Ask about substitution method next time', checked: false }
                  ]}
                  keyConcepts={["Integration by Parts", "Definite Integrals", "Practice Problems"]}
                  source="ai"
                  feedback={null}
                  onFeedback={() => {}}
                />
                <button
                  className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
                  title="Hide summary"
                  onClick={() => setShowSummary(false)}
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            )}
            {/* Use the same SessionHistoryWithRatings component as Tuto dashboard */}
            <SessionHistoryWithRatings
              sessions={sessionHistory}
              loading={loading}
              onDelete={handleDeleteSession}
            />
          </div>
        </div>
      </div>

      {/* Role Switch Modal */}
      <RoleSwitchModal
        isOpen={roleSwitchModalOpen}
        onClose={() => setRoleSwitchModalOpen(false)}
        onConfirm={handleRoleSwitch}
        currentRole="ROOKIE"
        targetRole="TUTO"
        userName={getUserDisplayName()}
      />
      
      {/* Debug component - remove in production */}
      
      </div>
  )
} 