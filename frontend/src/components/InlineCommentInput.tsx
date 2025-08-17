'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';
import ProfilePicture from './ProfilePicture';
import { useUser } from '@/hooks/useUser';

interface InlineCommentInputProps {
  onSubmit?: (body: string) => Promise<void>;
  placeholder?: string;
  isSubmitting?: boolean;
  className?: string;
}

export interface InlineCommentInputRef {
  toggle: () => void;
  isVisible: boolean;
}

const InlineCommentInput = forwardRef<InlineCommentInputRef, InlineCommentInputProps>(({
  onSubmit,
  placeholder = "Write a comment...",
  isSubmitting = false,
  className = ""
}, ref) => {
  const [commentText, setCommentText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { userProfile } = useUser();

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;
    
    try {
      await onSubmit?.(commentText.trim());
      setCommentText('');
      setIsVisible(false); // Hide the input after successful submission
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

  const toggleInput = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      // Focus the textarea when opening
      setTimeout(() => {
        const textarea = document.querySelector('.inline-comment-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    toggle: toggleInput,
    isVisible
  }));

  return (
    <div className={className}>
      {/* Comment Input (Conditionally Rendered) */}
      {isVisible && (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <ProfilePicture 
              src={userProfile?.user?.role === 'TUTO' ? userProfile?.tutoProfile?.selectedAvatar : userProfile?.rookieProfile?.selectedAvatar}
              alt={`${userProfile?.user?.firstName} ${userProfile?.user?.lastName}`}
              size="sm"
              fallbackText={`${userProfile?.user?.firstName} ${userProfile?.user?.lastName}`}
            />
            
            <div className="flex-1">
              {/* Textarea with embedded buttons */}
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={`inline-comment-textarea w-full p-2 pr-24 pb-16 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-colors bg-transparent ${
                    isFocused ? 'border-gray-400 ring-2 ring-gray-200' : ''
                  }`}
                  rows={1}
                  disabled={isSubmitting}
                />
                
                {/* Action Buttons - Positioned inside textarea */}
                <div className="absolute bottom-3 right-2 flex items-center space-x-2">
                  <button
                    onClick={toggleInput}
                    disabled={isSubmitting}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={!commentText.trim() || isSubmitting}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-3 h-3" />
                        <span>Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Keyboard shortcut hint */}
              <div className="text-xs text-gray-500 mt-1">
                Press Cmd+Enter to submit
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

InlineCommentInput.displayName = 'InlineCommentInput';

export default InlineCommentInput; 