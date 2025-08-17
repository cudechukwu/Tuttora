'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HomeIcon
} from '@heroicons/react/24/outline';
import PostView from '@/components/PostView';
import CommentThread from '@/components/CommentThread';
import ReplyInput from '@/components/ReplyInput';
import BackButton from '@/components/BackButton';
import { useUser } from '@/hooks/useUser';


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
  comments: Array<{
    id: string;
    body: string;
    author: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    createdAt: string;
    votes: Array<{
      voteType: 'UP' | 'DOWN';
      userId: string;
    }>;
    replies?: Array<{
      id: string;
      body: string;
      author: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        role: string;
      };
      createdAt: string;
      votes: Array<{
        voteType: 'UP' | 'DOWN';
        userId: string;
      }>;
      replies?: Array<{
        id: string;
        body: string;
        author: {
          id: string;
          username: string;
          firstName: string;
          lastName: string;
          role: string;
        };
        createdAt: string;
        votes: Array<{
          voteType: 'UP' | 'DOWN';
          userId: string;
        }>;
        replies?: Array<any>; // Recursive for unlimited nesting
      }>;
    }>;
  }>;
}

export default function ForumPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { userProfile } = useUser();
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  


  // Get current user ID
  const getCurrentUserId = () => {
    const userFromStorage = localStorage.getItem('user');
    const storedUser = userFromStorage ? JSON.parse(userFromStorage) : null;
    return storedUser?.id || null;
  };

  // Helper function to find nested replies recursively
  const findNestedReply = (replies: any[], targetId: string): number => {
    for (let i = 0; i < replies.length; i++) {
      if (replies[i].id === targetId) {
        return i;
      }
      if (replies[i].replies) {
        const found = findNestedReply(replies[i].replies, targetId);
        if (found !== -1) {
          return found;
        }
      }
    }
    return -1;
  };

  // Helper function to add reply to nested reply recursively
  const addToNestedReply = (replies: any[], targetId: string, newReply: any): boolean => {
    for (let i = 0; i < replies.length; i++) {
      if (replies[i].id === targetId) {
        // Found the target, add the reply here
        if (!replies[i].replies) {
          replies[i].replies = [];
        }
        replies[i].replies.push(newReply);
        return true;
      }
      if (replies[i].replies) {
        // Recursively search in nested replies
        const found = addToNestedReply(replies[i].replies, targetId, newReply);
        if (found) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper function to replace optimistic comment with real one recursively
  const replaceNestedReply = (replies: any[], optimisticId: string, realComment: any): boolean => {
    for (let i = 0; i < replies.length; i++) {
      if (replies[i].id === optimisticId) {
        // Found the optimistic comment, replace it
        replies[i] = realComment;
        return true;
      }
      if (replies[i].replies) {
        // Recursively search in nested replies
        const found = replaceNestedReply(replies[i].replies, optimisticId, realComment);
        if (found) {
          return true;
        }
      }
    }
    return false;
  };

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch(`/api/forum/posts/${postId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found');
          } else {
            setError('Failed to load post');
          }
          return;
        }

        const data = await response.json();
        if (data.success) {
          setPost(data.data);
        } else {
          setError(data.message || 'Failed to load post');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Handle back navigation with state preservation
  const handleBackToForum = () => {
    // Navigate back to forum with preserved state
    router.push('/forum');
  };

  // Handle post actions with optimistic updates
  const handlePostVote = async (postId: string, voteType: 'UP' | 'DOWN') => {
    if (!post) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    // Optimistic update
    const updatedPost = { ...post };
    const existingVoteIndex = updatedPost.votes.findIndex(v => v.userId === currentUserId);
    
    if (existingVoteIndex !== -1) {
      // Remove existing vote if same type, or update if different
      if (updatedPost.votes[existingVoteIndex].voteType === voteType) {
        updatedPost.votes.splice(existingVoteIndex, 1);
      } else {
        updatedPost.votes[existingVoteIndex].voteType = voteType;
      }
    } else {
      // Add new vote
      updatedPost.votes.push({ userId: currentUserId, voteType });
    }

    setPost(updatedPost);

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/forum/votes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          voteType
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPost(post);
        console.error('Error voting on post');
      }
    } catch (error) {
      // Revert optimistic update on error
      setPost(post);
      console.error('Error voting on post:', error);
    }
  };

  const handleCommentVote = async (commentId: string, voteType: 'UP' | 'DOWN') => {
    if (!post) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    // Optimistic update
    const updatedPost = { ...post };
    
    // Helper function to update vote in nested replies
    const updateVoteInReplies = (replies: any[], targetId: string): boolean => {
      for (let i = 0; i < replies.length; i++) {
        if (replies[i].id === targetId) {
          const comment = replies[i];
          const existingVoteIndex = comment.votes.findIndex((v: any) => v.userId === currentUserId);
          
          if (existingVoteIndex !== -1) {
            // Remove existing vote if same type, or update if different
            if (comment.votes[existingVoteIndex].voteType === voteType) {
              comment.votes.splice(existingVoteIndex, 1);
            } else {
              comment.votes[existingVoteIndex].voteType = voteType;
            }
          } else {
            // Add new vote
            comment.votes.push({ userId: currentUserId, voteType });
          }
          return true;
        }
        if (replies[i].replies) {
          const found = updateVoteInReplies(replies[i].replies, targetId);
          if (found) return true;
        }
      }
      return false;
    };

    // First check if it's a top-level comment
    const commentIndex = updatedPost.comments.findIndex(c => c.id === commentId);
    
    if (commentIndex !== -1) {
      const comment = updatedPost.comments[commentIndex];
      const existingVoteIndex = comment.votes.findIndex(v => v.userId === currentUserId);
      
      if (existingVoteIndex !== -1) {
        // Remove existing vote if same type, or update if different
        if (comment.votes[existingVoteIndex].voteType === voteType) {
          comment.votes.splice(existingVoteIndex, 1);
        } else {
          comment.votes[existingVoteIndex].voteType = voteType;
        }
      } else {
        // Add new vote
        comment.votes.push({ userId: currentUserId, voteType });
      }
      
      updatedPost.comments[commentIndex] = comment;
      setPost(updatedPost);
    } else {
      // Check if it's a nested reply
      const foundInReplies = updateVoteInReplies(updatedPost.comments, commentId);
      if (foundInReplies) {
        setPost(updatedPost);
      }
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/forum/votes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentId, 
          voteType
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPost(post);
        console.error('Error voting on comment');
      }
    } catch (error) {
      // Revert optimistic update on error
      setPost(post);
      console.error('Error voting on comment:', error);
    }
  };

  // Helper function to count all nested replies recursively
  const countNestedReplies = (replies: any[]): number => {
    let count = replies.length;
    for (const reply of replies) {
      if (reply.replies) {
        count += countNestedReplies(reply.replies);
      }
    }
    return count;
  };

  // Helper function to delete nested reply recursively
  const deleteNestedReply = (replies: any[], targetId: string): { deleted: boolean; count: number } => {
    for (let i = 0; i < replies.length; i++) {
      if (replies[i].id === targetId) {
        // Found the target, delete it and all its nested replies
        const deletedCount = replies[i].replies ? countNestedReplies(replies[i].replies) + 1 : 1;
        replies.splice(i, 1);
        return { deleted: true, count: deletedCount };
      }
      if (replies[i].replies) {
        // Recursively search in nested replies
        const result = deleteNestedReply(replies[i].replies, targetId);
        if (result.deleted) {
          return result;
        }
      }
    }
    return { deleted: false, count: 0 };
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!post) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    // Optimistic update - remove comment or reply with cascading delete
    const updatedPost = { ...post };
    
    // First check if it's a top-level comment
    let commentIndex = updatedPost.comments.findIndex(c => c.id === commentId);
    
    if (commentIndex !== -1) {
      // It's a top-level comment - delete it and all its nested replies
      const comment = updatedPost.comments[commentIndex];
      const deletedCount = comment.replies ? countNestedReplies(comment.replies) + 1 : 1;
      updatedPost.comments.splice(commentIndex, 1);
      updatedPost._count.comments -= deletedCount;
      setPost(updatedPost);
    } else {
      // Check if it's a reply in any comment - search recursively
      for (let i = 0; i < updatedPost.comments.length; i++) {
        const comment = updatedPost.comments[i];
        if (comment.replies) {
          const result = deleteNestedReply(comment.replies, commentId);
          if (result.deleted) {
            updatedPost._count.comments -= result.count;
            setPost(updatedPost);
            break;
          }
        }
      }
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/forum/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPost(post);
        console.error('Error deleting comment');
      }
    } catch (error) {
      // Revert optimistic update on error
      setPost(post);
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentSubmit = async (body: string, parentCommentId?: string) => {
    if (!post) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    // Create optimistic comment with real user data
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      body,
      author: {
        id: currentUserId,
        username: userProfile?.user?.username || 'current_user',
        firstName: userProfile?.user?.firstName || 'Current',
        lastName: userProfile?.user?.lastName || 'User',
        role: userProfile?.user?.role || 'STUDENT',
        rookieProfile: userProfile?.rookieProfile,
        tutoProfile: userProfile?.tutoProfile
      },
      createdAt: new Date().toISOString(),
      votes: []
    };

    // Optimistic update
    const updatedPost = { ...post };
    
    if (parentCommentId) {
      // This is a reply to a comment
      const parentCommentIndex = updatedPost.comments.findIndex(c => c.id === parentCommentId);
      if (parentCommentIndex !== -1) {
        if (!updatedPost.comments[parentCommentIndex].replies) {
          updatedPost.comments[parentCommentIndex].replies = [];
        }
        updatedPost.comments[parentCommentIndex].replies!.push(optimisticComment);
              } else {
          // Check if it's a reply to a reply (nested) - search recursively
          for (let i = 0; i < updatedPost.comments.length; i++) {
            const comment = updatedPost.comments[i];
            if (comment.replies) {
              const result = addToNestedReply(comment.replies, parentCommentId, optimisticComment);
              if (result) {
                break;
              }
            }
          }
        }
    } else {
      // This is a top-level comment
      updatedPost.comments.push(optimisticComment);
    }
    
    updatedPost._count.comments += 1;
    setPost(updatedPost);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/forum/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          body, 
          parentCommentId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Replace optimistic comment with real one
          const finalUpdatedPost = { ...updatedPost };
          
          if (parentCommentId) {
            // Update reply in the correct parent comment - search recursively
            const parentCommentIndex = finalUpdatedPost.comments.findIndex(c => c.id === parentCommentId);
            if (parentCommentIndex !== -1 && finalUpdatedPost.comments[parentCommentIndex].replies) {
              const replyIndex = finalUpdatedPost.comments[parentCommentIndex].replies!.findIndex(r => r.id === optimisticComment.id);
              if (replyIndex !== -1) {
                finalUpdatedPost.comments[parentCommentIndex].replies![replyIndex] = data.data;
              }
            } else {
              // Search recursively in nested replies
              for (let i = 0; i < finalUpdatedPost.comments.length; i++) {
                const comment = finalUpdatedPost.comments[i];
                if (comment.replies) {
                  const result = replaceNestedReply(comment.replies, optimisticComment.id, data.data);
                  if (result) {
                    break;
                  }
                }
              }
            }
          } else {
            // Update top-level comment
            const commentIndex = finalUpdatedPost.comments.findIndex(c => c.id === optimisticComment.id);
            if (commentIndex !== -1) {
              finalUpdatedPost.comments[commentIndex] = data.data;
            }
          }
          
          setPost(finalUpdatedPost);
        } else {
          // Revert optimistic update on error
          setPost(post);
        }
      } else {
        // Revert optimistic update on error
        setPost(post);
      }
    } catch (error) {
      // Revert optimistic update on error
      setPost(post);
      console.error('Error submitting comment:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
        {/* Navigation Header */}
        <nav className="bg-cover bg-center border-b border-gray-200 sticky top-0 z-50" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)', height: '3.25rem' }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center h-13 min-h-[3.25rem]">
              <div className="flex items-center space-x-6">
                <Link href="/forum" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
                  <HomeIcon className="w-4 h-4" />
                  <span className="font-medium tracking-tight">Forum</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-normal tracking-tight text-sm">
                  Loading...
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {/* Post skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
        {/* Navigation Header */}
        <nav className="bg-cover bg-center border-b border-gray-200 sticky top-0 z-50" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)', height: '3.25rem' }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center h-13 min-h-[3.25rem]">
              <div className="flex items-center space-x-6">
                <Link href="/forum" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
                  <HomeIcon className="w-4 h-4" />
                  <span className="font-medium tracking-tight">Forum</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-normal tracking-tight text-sm">
                  Error
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold text-gray-900">Post Not Found</h1>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={handleBackToForum}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Forum
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
        {/* Navigation Header */}
        <nav className="bg-cover bg-center border-b border-gray-200 sticky top-0 z-50" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)', height: '3.25rem' }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center h-13 min-h-[3.25rem]">
              <div className="flex items-center space-x-6">
                <Link href="/forum" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
                  <HomeIcon className="w-4 h-4" />
                  <span className="font-medium tracking-tight">Forum</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-normal tracking-tight text-sm">
                  Post Not Found
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold text-gray-900">Post Not Found</h1>
            <p className="text-gray-600">The post you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={handleBackToForum}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Forum
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
      {/* Navigation Header */}
      <nav className="bg-cover bg-center border-b border-gray-200 sticky top-0 z-50" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)', height: '3.25rem' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center h-13 min-h-[3.25rem]">
                          <div className="flex items-center space-x-6">
                <Link href="/forum" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
                  <HomeIcon className="w-4 h-4" />
                  <span className="font-medium tracking-tight">Forum</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-normal tracking-tight text-sm truncate max-w-xs">
                  {post.title}
                </span>
              </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Post Content */}
        <PostView
          post={post}
          currentUserId={getCurrentUserId()}
          onVote={handlePostVote}
          onComment={(body) => handleCommentSubmit(body)}
        />

        {/* Comments Section */}
        <div className="mt-8">
          <h3 className="text-gray-900 font-medium tracking-tight text-sm md:text-base mb-6">
            Comments ({post._count.comments})
          </h3>
          
          <CommentThread
            comments={post.comments}
            currentUserId={getCurrentUserId()}
            onVote={handleCommentVote}
            onReply={(commentId, body) => handleCommentSubmit(body, commentId)}
            onDelete={handleCommentDelete}
          />
        </div>
      </div>
    </div>
  );
} 