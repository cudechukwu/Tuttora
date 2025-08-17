'use client';

import { useState } from 'react';
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon,
  TrashIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';
import CommentDeleteConfirm from './CommentDeleteConfirm';
import DynamicTimeDisplay from './DynamicTimeDisplay';
import ProfilePicture from './ProfilePicture';

// Types
interface Comment {
  id: string;
  body: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    rookieProfile?: {
      selectedAvatar?: string;
    };
    tutoProfile?: {
      selectedAvatar?: string;
    };
  };
  createdAt: string;
  votes: Array<{
    voteType: 'UP' | 'DOWN';
    userId: string;
  }>;
  replies?: Comment[];
  _count?: {
    votes: number;
  };
}

interface CommentThreadProps {
  comments: Comment[];
  currentUserId?: string;
  onVote?: (commentId: string, voteType: 'UP' | 'DOWN') => void;
  onReply?: (commentId: string, body: string) => void;
  onDelete?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  onShowReplies?: (commentId: string) => void;
}

export default function CommentThread({
  comments,
  currentUserId,
  onVote,
  onReply,
  onDelete,
  onReport,
  onShowReplies
}: CommentThreadProps) {
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getUserVote = (votes: any[], userId: string) => {
    const userVote = votes.find(v => v.userId === userId);
    return userVote ? userVote.voteType : null;
  };

  const getVoteCount = (votes: any[]) => {
    const upvotes = votes.filter(v => v.voteType === 'UP').length;
    const downvotes = votes.filter(v => v.voteType === 'DOWN').length;
    return upvotes - downvotes;
  };

  const handleVote = async (commentId: string, voteType: 'UP' | 'DOWN') => {
    if (!currentUserId) return;
    await onVote?.(commentId, voteType);
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  const submitReply = () => {
    if (!replyText.trim() || !replyingTo) return;
    
    onReply?.(replyingTo, replyText.trim());
    setReplyingTo(null);
    setReplyText('');
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleDeleteClick = (commentId: string) => {
    setDeleteConfirmId(commentId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(true);
    try {
      await onDelete?.(deleteConfirmId);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const userVote = getUserVote(comment.votes, currentUserId || '');
    const voteCount = getVoteCount(comment.votes);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}>
        <div className="py-4">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <ProfilePicture 
                src={comment.author.role === 'TUTO' ? comment.author.tutoProfile?.selectedAvatar : comment.author.rookieProfile?.selectedAvatar}
                alt={`${comment.author.firstName} ${comment.author.lastName}`}
                size="sm"
                fallbackText={`${comment.author.firstName} ${comment.author.lastName}`}
              />
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-medium tracking-tight text-sm">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-xs font-medium text-gray-500 tracking-tight">
                  <DynamicTimeDisplay timestamp={comment.createdAt} />
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              {onReport && (
                <button
                  onClick={() => onReport(comment.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Report comment"
                >
                  <FlagIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Comment Body */}
                        <div className="text-gray-700 text-sm md:text-base font-normal leading-relaxed mb-3">
                {comment.body}
              </div>

          {/* Comment Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Vote Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  className={`p-1 rounded transition-colors ${
                    userVote === 'UP' 
                      ? 'text-gray-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => handleVote(comment.id, 'UP')}
                  disabled={!currentUserId}
                  title="Upvote"
                >
                  {userVote === 'UP' ? (
                    <HandThumbUpIconSolid className="w-3 h-3" />
                  ) : (
                    <HandThumbUpIcon className="w-3 h-3" />
                  )}
                </button>
                
                <span className="text-xs font-medium text-gray-700 tracking-tight min-w-[1.5rem] text-center">
                  {voteCount}
                </span>
                
                <button
                  className={`p-1 rounded transition-colors ${
                    userVote === 'DOWN' 
                      ? 'text-red-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => handleVote(comment.id, 'DOWN')}
                  disabled={!currentUserId}
                  title="Downvote"
                >
                  {userVote === 'DOWN' ? (
                    <HandThumbDownIconSolid className="w-3 h-3" />
                  ) : (
                    <HandThumbDownIcon className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Reply Button */}
              {onReply && currentUserId && (
                <button
                  onClick={() => handleReply(comment.id)}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 tracking-tight hover:text-gray-700 transition-colors"
                >
                  <ChatBubbleLeftIcon className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              )}

              {/* Show/Hide Replies */}
              {hasReplies && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 tracking-tight hover:text-gray-700 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronRightIcon className="w-3 h-3" />
                  )}
                  <span>
                    {isExpanded ? 'Hide' : 'Show'} {comment.replies?.length} replies
                  </span>
                </button>
              )}
            </div>

            {/* Delete Button - Bottom Right */}
            {onDelete && comment.author.id === currentUserId && (
              deleteConfirmId === comment.id ? (
                <CommentDeleteConfirm
                  onConfirm={handleDeleteConfirm}
                  onCancel={handleDeleteCancel}
                  isDeleting={isDeleting}
                />
              ) : (
                <button
                  onClick={() => handleDeleteClick(comment.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete comment"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-4">
              <div className="relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full p-2 pr-24 pb-16 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none bg-transparent text-xs"
                  rows={1}
                />
                <div className="absolute bottom-3 right-2 flex items-center space-x-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim()}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="mt-2">
            {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {comments.map((comment) => renderComment(comment))}
    </div>
  );
} 