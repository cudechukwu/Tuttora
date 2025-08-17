'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HandThumbUpIcon, BookmarkIcon, ShareIcon, FlagIcon, TrashIcon, AcademicCapIcon, BookOpenIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/outline';

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

interface VirtualizedPostListProps {
  posts: ForumPost[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDeletePost: (postId: string) => void;
  currentUserId?: string;
  getRoleBadge: (role: string) => { icon: React.ReactNode; label: string; color: string };
  getVoteCount: (votes: any[]) => number;
  formatDate: (dateString: string) => string;
}

const ITEM_HEIGHT = 200; // Estimated height of each post item
const BUFFER_SIZE = 5; // Number of items to render outside viewport

export default function VirtualizedPostList({
  posts,
  loading,
  hasMore,
  onLoadMore,
  onDeletePost,
  currentUserId,
  getRoleBadge,
  getVoteCount,
  formatDate,
}: VirtualizedPostListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleStart = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const visibleEnd = Math.min(
    posts.length - 1,
    Math.floor((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );

  // Get visible posts
  const visiblePosts = posts.slice(visibleStart, visibleEnd + 1);

  // Calculate total height for scrollbar
  const totalHeight = posts.length * ITEM_HEIGHT;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);

    // Check if we need to load more
    const scrollBottom = scrollTop + containerHeight;
    const threshold = totalHeight - 1000; // Load more when 1000px from bottom

    if (scrollBottom >= threshold && hasMore && !loading) {
      onLoadMore();
    }
  }, [containerHeight, totalHeight, hasMore, loading, onLoadMore]);

  // Set container height on mount
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  // Calculate transform for virtual scrolling
  const getTransform = (index: number) => {
    return `translateY(${index * ITEM_HEIGHT}px)`;
  };

  if (posts.length === 0 && !loading) {
    return (
      <div className="py-12 text-center border-b border-gray-100">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-gray-700 font-medium tracking-tight text-sm md:text-base lg:text-lg mb-2">No posts yet</h3>
        <p className="text-gray-500 text-xs md:text-sm font-medium tracking-tight italic font-serif mb-4">
          Be the first to ask a question and start a discussion!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onScroll={handleScroll}
      style={{ height: 'calc(100vh - 200px)' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visiblePosts.map((post, index) => {
          const actualIndex = visibleStart + index;
          const roleBadge = getRoleBadge(post.author.role);
          const voteCount = getVoteCount(post.votes);

          return (
            <div
              key={post.id}
              className="absolute w-full"
              style={{
                transform: getTransform(actualIndex),
                height: ITEM_HEIGHT,
              }}
            >
              <div className="py-6 border-b border-gray-200">
                <div className="flex items-start gap-4">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <HandThumbUpIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    <span className="text-lg font-semibold text-black leading-tight">{voteCount}</span>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <HandThumbUpIcon className="w-4 h-4 text-gray-400 rotate-180" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                                          <h3 className="text-gray-700 font-medium tracking-tight text-sm md:text-base lg:text-lg hover:text-gray-600 cursor-pointer flex-1">
                      {post.title}
                    </h3>
                      {/* Show delete button only for posts created by current user */}
                      {post.author.id === currentUserId && (
                        <button
                          className="p-1 rounded transition-colors text-gray-900 hover:text-red-600 ml-2"
                          title="Delete Post"
                          onClick={() => onDeletePost(post.id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-500 text-xs md:text-sm font-medium tracking-tight italic font-serif mb-4 line-clamp-2">
                      {post.body}
                    </p>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-900"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {post.attachments.map((attachment, attachmentIndex) => {
                            const isImage = attachment.match(/\.(jpg|jpeg|png)$/i);
                            const isPdf = attachment.match(/\.pdf$/i);

                            return (
                              <div key={attachmentIndex} className="relative">
                                {isImage ? (
                                  <img
                                    src={attachment}
                                    alt="Post attachment"
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(attachment, '_blank')}
                                  />
                                ) : isPdf ? (
                                  <div
                                    className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() => window.open(attachment, '_blank')}
                                  >
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Post Meta */}
                    <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-900">
                      <div className="flex items-center gap-2 md:gap-4">
                        <span className="flex items-center gap-1">
                                                      {post.author.id === currentUserId ? (
                              <>By you <SparklesIcon className="w-3 h-3 text-yellow-500 fill-current" /></>
                            ) : (
                            <>
                              By {post.author.firstName} {post.author.lastName}{' '}
                              <span className="text-gray-500 text-[10px]">{roleBadge.icon}</span>
                            </>
                          )}
                        </span>
                        <span>•</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span>•</span>
                        <span>{post._count.replies} replies</span>
                        <span>•</span>
                        <span>{post._count.comments} comments</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 md:gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Save">
                          <BookmarkIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Share">
                          <ShareIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Report">
                          <FlagIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm">Loading posts...</span>
          </div>
        </div>
      )}
    </div>
  );
} 