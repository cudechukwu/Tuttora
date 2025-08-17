'use client';

import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import ProfilePicture from './ProfilePicture';
import { useUser } from '@/hooks/useUser';

interface ReplyInputProps {
  postId?: string;
  parentCommentId?: string;
  placeholder?: string;
  onSubmit?: (body: string) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export default function ReplyInput({
  postId,
  parentCommentId,
  placeholder = "Write a comment...",
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ""
}: ReplyInputProps) {
  const [commentText, setCommentText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { userProfile } = useUser();

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;
    
    try {
      await onSubmit?.(commentText.trim());
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCancel = () => {
    setCommentText('');
    onCancel?.();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <ProfilePicture 
          src={userProfile?.user?.role === 'TUTO' ? userProfile?.tutoProfile?.selectedAvatar : userProfile?.rookieProfile?.selectedAvatar}
          alt={`${userProfile?.user?.firstName} ${userProfile?.user?.lastName}`}
          size="sm"
          fallbackText={`${userProfile?.user?.firstName} ${userProfile?.user?.lastName}`}
        />
        
        <div className="flex-1">
          {/* Textarea */}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-colors bg-transparent ${
              isFocused ? 'border-gray-400' : ''
            }`}
            rows={3}
            disabled={isSubmitting}
          />
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500">
              Press Cmd+Enter to submit
            </div>
            
            <div className="flex items-center space-x-2">
              {onCancel && (
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={!commentText.trim() || isSubmitting}
                className="flex items-center space-x-1 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>Post Comment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 