import React from 'react';
import { StarIcon, UserIcon, CalendarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface SessionHistoryItem {
  sessionId: string;
  rating: number | null;
  feedback: string;
  role: 'TUTO' | 'ROOKIE';
  createdAt: Date;
  // Add fields for student info (we'll need to fetch this from the backend)
  studentName?: string;
  courseTitle?: string;
  avatar?: string | null;
}

interface SessionHistoryWithRatingsProps {
  sessions: SessionHistoryItem[];
  loading?: boolean;
  onDelete?: (sessionId: string) => void;
}

const SessionHistoryWithRatings: React.FC<SessionHistoryWithRatingsProps> = ({ 
  sessions, 
  loading = false,
  onDelete
}) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(rating);
          const isHalfFilled = !isFilled && star === Math.ceil(rating) && rating % 1 !== 0;
          
          if (isFilled) {
            return (
              <StarIconSolid
                key={star}
                className="w-4 h-4 text-yellow-400"
              />
            );
          } else if (isHalfFilled) {
            return (
              <div key={star} className="relative w-4 h-4">
                <StarIcon className="w-4 h-4 text-gray-300" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <StarIconSolid className="w-4 h-4 text-yellow-400" />
                </div>
              </div>
            );
          } else {
            return (
              <StarIcon
                key={star}
                className="w-4 h-4 text-gray-300"
              />
            );
          }
        })}
      </div>
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays >= 7) {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="w-4 h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <UserIcon className="w-10 h-10 text-gray-400 mb-3" />
        <p className="text-gray-700 font-medium tracking-tight text-xs md:text-sm mb-1">No session history yet</p>
        <p className="text-gray-500 text-xs font-medium tracking-tight italic font-serif">Complete your first session to see ratings and feedback here</p>
      </div>
    );
  }

  // Filter out sessions that don't have a rating
  const ratedSessions = sessions.filter(session => session.rating !== null && session.rating > 0);

  if (ratedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <UserIcon className="w-10 h-10 text-gray-400 mb-3" />
        <p className="text-gray-700 font-medium tracking-tight text-xs md:text-sm mb-1">No rated sessions yet</p>
        <p className="text-gray-500 text-xs font-medium tracking-tight italic font-serif">Complete and rate sessions to see feedback here</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
      {ratedSessions.map((session) => {
        // Use the real student name and course title from backend
        const studentName = session.studentName || 'Unknown Student';
        const courseTitle = session.courseTitle || 'General';
        const initials = getInitials(studentName);
        
        return (
          <div key={session.sessionId} className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {session.avatar ? (
                  <img 
                    src={session.avatar} 
                    alt={studentName}
                    className="w-8 h-8 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-gray-700">{initials}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{studentName}</p>
                  <p className="text-xs text-gray-600">{courseTitle} • {formatTimeAgo(session.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                {renderStars(session.rating!)}
              </div>
            </div>
            
            {session.feedback && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 italic flex-1">
                  "{session.feedback}"
                </p>
                {onDelete && (
                  <button
                    onClick={() => onDelete(session.sessionId)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 ml-2 flex-shrink-0"
                    title="Remove from feed"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SessionHistoryWithRatings; 