import React, { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon, AcademicCapIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TutorInfo {
  id: string;
  name: string;
  username: string;
  email: string;
  expertise: Array<{
    course: {
      code: string;
      title: string;
      department: string;
    };
    proficiencyLevel: string | null;
    semesterTaken: string | null;
    yearCompleted: number | null;
  }>;
  profile?: {
    bio?: string;
    teachingBio?: string;
    year?: string;
    yearOfStudy?: string;
    major?: string;
    tags?: string[];
  };
  rating?: {
    average: number;
    count: number;
  };
  gracePeriodEnd?: string;
  timeRemaining: number;
}

interface TutorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  tutorName: string;
  onRefresh?: () => void; // Add refresh callback
}

export default function TutorInfoModal({ isOpen, onClose, sessionId, tutorName, onRefresh }: TutorInfoModalProps) {
  const [tutorInfo, setTutorInfo] = useState<TutorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [sessionJoined, setSessionJoined] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchTutorInfo();
    }
  }, [isOpen, sessionId]);

  // Real-time countdown timer
  useEffect(() => {
    if (!tutorInfo?.timeRemaining) return;

    setTimeRemaining(tutorInfo.timeRemaining);
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tutorInfo?.timeRemaining]);

  // Keyboard escape handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fetchTutorInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/tutor-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tutor information');
      }

      const data = await response.json();
      if (data.success) {
        setTutorInfo(data.tutorInfo);
      } else {
        throw new Error(data.error || 'Failed to fetch tutor information');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProficiencyLabel = (level: string | null) => {
    switch (level) {
      case 'CURRENTLY_TAKING': return 'Currently Taking';
      case 'TOOK_COURSE': return 'Took Course';
      case 'GOT_A': return 'Got A';
      case 'TUTORED_BEFORE': return 'Tutored Before';
      case 'TAED': return 'TA/ed';
      default: return 'Not Specified';
    }
  };

  const getSemesterLabel = (semester: string | null) => {
    switch (semester) {
      case 'FALL': return 'Fall';
      case 'SPRING': return 'Spring';
      case 'SUMMER': return 'Summer';
      default: return 'Not Specified';
    }
  };

  // Cancel session during grace period
  const handleCancelSession = async () => {
    if (!sessionId) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to cancel this session? This will unmatch the tutor and send the request to other qualified tutors.'
    );
    
    if (!confirmed) return;
    
    setIsCanceling(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/cancel-grace-period`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: 'Rookie canceled during grace period'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel session');
      }

      const data = await response.json();
      
      // Close modal and refresh dashboard
      onClose();
      
      // Refresh dashboard data to update the session list
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Error canceling session:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel session');
    } finally {
      setIsCanceling(false);
    }
  };

  // Join session
  const handleJoinSession = async () => {
    if (!sessionId) return;
    
    setIsJoining(true);
    setError(null);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('accessToken');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Session ID:', sessionId);
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Call the accept session endpoint to change status from PENDING_CONFIRMATION to ACCEPTED
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to accept session');
      }

      const result = await response.json();
      console.log('Success:', result);

      // Mark session as joined
      setSessionJoined(true);
      
      // Close modal
      onClose();
      
      // Refresh dashboard data
      if (onRefresh) {
        onRefresh();
      }
      
      // Redirect to session page (same as session card behavior)
      window.open(`/session/${sessionId}`, '_blank');
      
    } catch (error) {
      console.error('Error accepting session:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept session');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-medium text-gray-700 tracking-tight">Tutor Information</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm font-medium tracking-tight">{error}</p>
            </div>
          )}

          {tutorInfo && !loading && (
            <div className="space-y-6">
              {/* Header - Horizontal Layout with Proper Alignment */}
              <div className="flex flex-row items-center justify-between gap-4 mt-4 mb-6">
                {/* Left Column - Profile Picture + Name + Username */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <UserIcon className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-base font-medium text-gray-700 tracking-tight mb-1">{tutorInfo.name}</h3>
                  <p className="text-gray-500 text-xs font-medium tracking-tight">@{tutorInfo.username}</p>
                </div>

                {/* Right Column - Major + Rating + Bio */}
                <div className="flex flex-col items-start text-left flex-1">
                  <p className="text-xs font-medium text-gray-700 tracking-tight mb-1">
                    🎓 {tutorInfo.profile?.year} • {tutorInfo.profile?.major}
                  </p>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor((tutorInfo.rating?.average || 0))
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-700 tracking-tight">
                     {tutorInfo.rating?.average || 0} stars ({tutorInfo.rating?.count || 0} reviews)
                    </span>
                  </div>
                  {tutorInfo.profile?.bio && (
                    <p className="text-xs text-gray-700 leading-relaxed font-medium tracking-tight italic">
                      "{tutorInfo.profile.bio}"
                    </p>
                  )}
                </div>
              </div>

              {/* Grace Period Timer */}
              {timeRemaining > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900 tracking-tight">
                        Time to decide: {formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-1 font-medium tracking-tight">You can cancel at no cost during this period</p>
                </div>
              )}

              {/* Courses & Expertise */}
              {tutorInfo.expertise && tutorInfo.expertise.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-700 tracking-tight mb-3">Courses & Expertise</h4>
                  <div className="space-y-3">
                    {tutorInfo.expertise.map((exp, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-700 text-xs tracking-tight mb-1">
                          {exp.course.code}: {exp.course.title}
                        </h5>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded font-medium tracking-tight">
                            {exp.course.department}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 font-medium tracking-tight">
                          <span>Proficiency: </span>
                          <span className="text-gray-700 font-medium tracking-tight">
                            {getProficiencyLabel(exp.proficiencyLevel)}
                          </span>
                        </div>
                        {(exp.semesterTaken || exp.yearCompleted) && (
                          <div className="text-xs text-gray-700 font-medium tracking-tight">
                            <span>Taken: </span>
                            <span className="text-gray-700 font-medium tracking-tight">
                              {exp.semesterTaken && exp.yearCompleted 
                                ? `${getSemesterLabel(exp.semesterTaken)} ${exp.yearCompleted}`
                                : exp.semesterTaken || exp.yearCompleted
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills/Tags */}
              {tutorInfo.profile?.tags && tutorInfo.profile.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-700 tracking-tight mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {tutorInfo.profile.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium tracking-tight"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                  {/* Back Button */}
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium tracking-tight text-xs hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>

                  {/* Cancel Button */}
                  <button
                    onClick={handleCancelSession}
                    className="flex-1 sm:flex-none px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium tracking-tight text-xs hover:bg-red-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCanceling || sessionJoined}
                  >
                    {isCanceling ? (
                      <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {sessionJoined ? 'Session Joined' : isCanceling ? 'Canceling...' : 'Cancel'}
                  </button>

                  {/* Join Session Button */}
                  <button
                    onClick={handleJoinSession}
                    className="flex-1 sm:flex-none px-4 py-2 border border-green-600 text-green-700 rounded-lg font-medium tracking-tight text-xs hover:bg-green-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isJoining || sessionJoined}
                  >
                    {isJoining ? (
                      <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {sessionJoined ? 'Session Started' : isJoining ? 'Joining...' : 'Join Session'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 