'use client';

import { useState, useRef } from 'react';
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon,
  TrashIcon,
  FlagIcon,
  ShareIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';
import DynamicTimeDisplay from './DynamicTimeDisplay';
import ProfilePicture from './ProfilePicture';
import InlineCommentInput, { InlineCommentInputRef } from './InlineCommentInput';
import AttachmentDisplay from './AttachmentDisplay';

// Types
interface ForumPost {
  id: string;
  title: string;
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
  tags: string[];
  urgency: 'GENERAL' | 'HIGH' | 'URGENT';
  postType: 'QUESTION' | 'ANSWER' | 'DISCUSSION';
  attachments: string[];
  createdAt: string;
  _count: {
    replies: number;
    comments: number;
    votes: number;
  };
  votes: Array<{
    voteType: 'UP' | 'DOWN';
    userId: string;
  }>;
}

interface PostViewProps {
  post: ForumPost;
  currentUserId?: string;
  onVote?: (postId: string, voteType: 'UP' | 'DOWN') => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onComment?: (body: string) => Promise<void>;
}

export default function PostView({
  post,
  currentUserId,
  onVote,
  onDelete,
  onReport,
  onShare,
  onBookmark,
  onComment
}: PostViewProps) {
  const commentInputRef = useRef<InlineCommentInputRef>(null);

  const getUserVote = (votes: any[], userId: string) => {
    const userVote = votes.find(v => v.userId === userId);
    return userVote ? userVote.voteType : null;
  };

  const getVoteCount = (votes: any[]) => {
    const upvotes = votes.filter(v => v.voteType === 'UP').length;
    const downvotes = votes.filter(v => v.voteType === 'DOWN').length;
    return upvotes - downvotes;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'GENERAL':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'Urgent';
      case 'HIGH':
        return 'High Priority';
      case 'GENERAL':
        return 'General';
      default:
        return 'General';
    }
  };

  const handleVote = async (voteType: 'UP' | 'DOWN') => {
    if (!currentUserId) return;
    await onVote?.(post.id, voteType);
  };

  const handleCommentToggle = () => {
    commentInputRef.current?.toggle();
  };

  const userVote = getUserVote(post.votes, currentUserId || '');
  const voteCount = getVoteCount(post.votes);

  return (
    <div className="space-y-6">
      {/* Post Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <ProfilePicture 
                src={post.author.role === 'TUTO' ? post.author.tutoProfile?.selectedAvatar : post.author.rookieProfile?.selectedAvatar}
                alt={`${post.author.firstName} ${post.author.lastName}`}
                size="md"
                fallbackText={`${post.author.firstName} ${post.author.lastName}`}
              />
              <h1 className="text-lg md:text-xl lg:text-2xl font-medium text-gray-900 tracking-tight">
                {post.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-xs md:text-sm font-medium text-gray-500 tracking-tight">
              <span>By {post.author.firstName} {post.author.lastName}</span>
              <span>•</span>
              <span className="text-[10px] md:text-xs">
                <DynamicTimeDisplay timestamp={post.createdAt} />
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {onShare && (
              <button
                onClick={() => onShare(post.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Share post"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
            )}
            
            {onBookmark && (
              <button
                onClick={() => onBookmark(post.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Bookmark post"
              >
                <BookmarkIcon className="w-4 h-4" />
              </button>
            )}
            
            {onReport && (
              <button
                onClick={() => onReport(post.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Report post"
              >
                <FlagIcon className="w-4 h-4" />
              </button>
            )}
            
            {onDelete && post.author.id === currentUserId && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete post"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>


      </div>

      {/* Post Body */}
      <div className="space-y-6">
        <div className="prose max-w-none">
          <p className="text-gray-700 text-sm md:text-base font-normal leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>
        </div>

        {/* Attachments */}
        <AttachmentDisplay attachments={post.attachments} />
      </div>

      {/* Vote Section */}
      <div className="pt-4 border-t border-gray-100">
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
                onClick={() => handleVote('UP')}
                disabled={!currentUserId}
                title="Upvote"
              >
                {userVote === 'UP' ? (
                  <HandThumbUpIconSolid className="w-5 h-5" />
                ) : (
                  <HandThumbUpIcon className="w-5 h-5" />
                )}
              </button>
              
              <span className="text-sm font-medium text-gray-700 min-w-[2rem] text-center">
                {voteCount}
              </span>
              
              <button
                className={`p-1 rounded transition-colors ${
                  userVote === 'DOWN' 
                    ? 'text-red-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                onClick={() => handleVote('DOWN')}
                disabled={!currentUserId}
                title="Downvote"
              >
                {userVote === 'DOWN' ? (
                  <HandThumbDownIconSolid className="w-5 h-5" />
                ) : (
                  <HandThumbDownIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <span className="text-sm text-gray-500">
              {post._count.votes} votes
            </span>

            {/* Comment Button */}
            {currentUserId && onComment && (
              <button
                onClick={handleCommentToggle}
                className="flex items-center space-x-1 text-xs md:text-sm font-medium text-gray-500 tracking-tight hover:text-gray-700 transition-colors"
                title="Add comment"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>Comment</span>
              </button>
            )}
          </div>
          

        </div>
      </div>

      {/* Inline Comment Input - Full Width Block */}
      {currentUserId && onComment && (
        <div className="mt-4">
          <InlineCommentInput
            ref={commentInputRef}
            onSubmit={onComment}
            placeholder="Write a comment..."
          />
        </div>
      )}
    </div>
  );
} 