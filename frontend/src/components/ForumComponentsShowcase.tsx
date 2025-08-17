'use client';

import { useState } from 'react';
import PostView from './PostView';
import CommentThread from './CommentThread';
import ReplyInput from './ReplyInput';
import BackButton from './BackButton';

// Mock data for showcase
const mockPost = {
  id: 'showcase-post',
  title: 'Sample Forum Post',
  body: 'This is a sample post to demonstrate the forum components. It shows how the PostView, CommentThread, and ReplyInput components work together.',
  author: {
    id: 'user1',
    username: 'john_doe',
    firstName: 'John',
    lastName: 'Doe',
    role: 'STUDENT'
  },
  tags: ['sample', 'demo', 'components'],
  urgency: 'GENERAL' as const,
  postType: 'QUESTION' as const,
  attachments: [],
  createdAt: new Date().toISOString(),
  _count: {
    replies: 0,
    comments: 2,
    votes: 5
  },
  votes: [
    { voteType: 'UP', userId: 'user1' },
    { voteType: 'UP', userId: 'user2' },
    { voteType: 'DOWN', userId: 'user3' }
  ]
};

const mockComments = [
  {
    id: 'comment1',
    body: 'This is a great sample comment!',
    author: {
      id: 'user2',
      username: 'jane_smith',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'TUTOR'
    },
    createdAt: new Date().toISOString(),
    votes: [
      { voteType: 'UP', userId: 'user1' }
    ]
  },
  {
    id: 'comment2',
    body: 'Another comment to show the threading functionality.',
    author: {
      id: 'user3',
      username: 'bob_wilson',
      firstName: 'Bob',
      lastName: 'Wilson',
      role: 'STUDENT'
    },
    createdAt: new Date().toISOString(),
    votes: [],
    replies: [
      {
        id: 'reply1',
        body: 'This is a reply to the second comment!',
        author: {
          id: 'user1',
          username: 'john_doe',
          firstName: 'John',
          lastName: 'Doe',
          role: 'STUDENT'
        },
        createdAt: new Date().toISOString(),
        votes: []
      }
    ]
  }
];

export default function ForumComponentsShowcase() {
  const [currentUserId] = useState('user1');

  const handlePostVote = async (postId: string, voteType: 'UP' | 'DOWN') => {
    console.log('Post vote:', { postId, voteType });
  };

  const handleCommentVote = async (commentId: string, voteType: 'UP' | 'DOWN') => {
    console.log('Comment vote:', { commentId, voteType });
  };

  const handleCommentSubmit = async (body: string) => {
    console.log('New comment:', body);
  };

  const handleBackClick = () => {
    console.log('Back button clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Forum Components Showcase
          </h1>
          <p className="text-gray-600">
            This page demonstrates all the forum components working together.
          </p>
        </div>

        {/* BackButton Component */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">BackButton Component</h2>
          <BackButton onClick={handleBackClick} />
        </div>

        {/* PostView Component */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">PostView Component</h2>
          <PostView
            post={mockPost}
            currentUserId={currentUserId}
            onVote={handlePostVote}
          />
        </div>

        {/* CommentThread Component */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CommentThread Component</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CommentThread
              comments={mockComments}
              currentUserId={currentUserId}
              onVote={handleCommentVote}
              onReply={handleCommentSubmit}
            />
          </div>
        </div>

        {/* ReplyInput Component */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ReplyInput Component</h2>
          <ReplyInput
            postId="showcase-post"
            onSubmit={handleCommentSubmit}
            placeholder="Write a comment for the showcase..."
          />
        </div>
      </div>
    </div>
  );
} 