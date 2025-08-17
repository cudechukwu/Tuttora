'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { 
  MagnifyingGlassIcon,
  PlusIcon,
  HandThumbUpIcon,
  ShareIcon,
  FlagIcon,
  BellIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  AcademicCapIcon,
  BookOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/contexts/ToastContext';
import { useSocket } from '@/contexts/SocketContext';
import CreatePostModal from '@/components/CreatePostModal';
import DynamicTimeDisplay from '@/components/DynamicTimeDisplay';
import ProfilePicture from '@/components/ProfilePicture';
import AttachmentDisplay from '@/components/AttachmentDisplay';

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
  attachments: string[]; // Array of Firebase Storage URLs
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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ForumFilters {
  search: string;
  filter: 'all' | 'following' | 'popular' | 'my-posts';
}

export default function ForumPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [visiblePosts, setVisiblePosts] = useState<ForumPost[]>([]);
  const [filters, setFilters] = useState<ForumFilters>({
    search: '',
    filter: 'all'
  });
  
  // Track recently processed posts to prevent duplicates
  const recentlyProcessedPosts = useRef(new Set<string>());
  

  
  // Following tags state
  const [followingTags, setFollowingTags] = useState<string[]>(['calculus', 'econ', 'physics']);
  const [showEditTags, setShowEditTags] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { userProfile, loading: userLoading } = useUser();
  const { showToast } = useToast();
  const { socket, isConnected, joinForum, leaveForum } = useSocket();

  // State for stored user data
  const [storedUser, setStoredUser] = useState<any>(null);
  const [lastUsedDashboard, setLastUsedDashboard] = useState('tuto');

  // Get current user ID from multiple sources
  const getCurrentUserId = () => {
    // First try from userProfile
    if (userProfile?.user?.id) {
      return userProfile.user.id;
    }
    // Fallback to storedUser state
    if (storedUser?.id) {
      return storedUser.id;
    }
    return null;
  };
  
  // Smart default for BOTH users - get last used dashboard preference
  const getLastUsedDashboard = () => {
    return lastUsedDashboard;
  };
  
  const setLastUsedDashboardPreference = (dashboard: 'rookie' | 'tuto') => {
    setLastUsedDashboard(dashboard);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastUsedDashboard', dashboard);
    }
  };
  
  // Determine which dashboard to show for BOTH users
  const isBothUser = userProfile?.user?.role === 'BOTH' || userProfile?.user?.role === 'both' || storedUser?.role === 'BOTH' || storedUser?.role === 'both';
  const shouldShowTutoDashboard = userProfile?.user?.role === 'TUTO' || userProfile?.user?.role === 'tuto' || storedUser?.role === 'TUTO' || storedUser?.role === 'tuto' || (isBothUser && lastUsedDashboard === 'tuto');


  // Load stored user data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userFromStorage = localStorage.getItem('user');
        if (userFromStorage) {
          setStoredUser(JSON.parse(userFromStorage));
        }
        
        const dashboardPreference = localStorage.getItem('lastUsedDashboard');
        if (dashboardPreference) {
          setLastUsedDashboard(dashboardPreference);
        }
      } catch (error) {
        console.error('Error loading stored user data:', error);
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      setPosts([]);
      setVisiblePosts([]);
      fetchPosts(1, true);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Fetch forum posts for filter changes (non-search)
  useEffect(() => {
    if (filters.filter !== 'all') {
      setCurrentPage(1);
      setPosts([]);
      setVisiblePosts([]);
      fetchPosts(1, true);
    }
  }, [filters.filter]);

  // Load more posts when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 &&
        hasMore &&
        !loading
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  // Real-time forum updates
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[FORUM] Socket not ready:', { 
        socket: !!socket, 
        isConnected, 
        universityId: userProfile?.user?.university?.id 
      });
      return;
    }

    // Get university ID from multiple sources
    const universityId = userProfile?.user?.university?.id || 
                        storedUser?.universityId;

    if (!universityId) {
      console.log('[FORUM] No university ID found, using default forum room');
      console.log('[FORUM] User profile:', userProfile);
      console.log('[FORUM] Stored user:', storedUser);
      // Use a default forum room for users without university
      const defaultUniversityId = 'default-forum';
      console.log('[FORUM] Joining default forum room:', defaultUniversityId);
      joinForum(defaultUniversityId);
      return;
    }

        console.log('[FORUM] Joining forum for university:', universityId);
    // Join forum room for user's university
    joinForum(universityId);

    // Handle new forum posts
    const handleNewPost = (newPost: ForumPost) => {
      console.log('[FORUM] Received new post:', newPost.id, newPost.title);
      
      // Prevent processing the same post multiple times in quick succession
      if (recentlyProcessedPosts.current.has(newPost.id)) {
        console.log('[FORUM] Post recently processed, skipping:', newPost.id);
        return;
      }
      
      // Mark this post as recently processed
      recentlyProcessedPosts.current.add(newPost.id);
      
      // Clean up the set after 5 seconds to prevent memory leaks
      setTimeout(() => {
        recentlyProcessedPosts.current.delete(newPost.id);
      }, 5000);
      
      // Only add if it matches current filters
      if (matchesCurrentFilters(newPost, filters)) {
        console.log('[FORUM] Post matches filters, processing');
        setPosts(prev => {
          // Check if post already exists
          const existingIndex = prev.findIndex(post => post.id === newPost.id);
          
          if (existingIndex !== -1) {
            console.log('[FORUM] Post already exists, replacing with confirmed version');
            // Replace the existing post with the confirmed version
            const updatedPosts = [...prev];
            updatedPosts[existingIndex] = newPost;
            return updatedPosts;
          } else {
            console.log('[FORUM] Adding new post to list');
            return [newPost, ...prev];
          }
        });

        // Update visible posts if on first page
        if (currentPage === 1) {
          setVisiblePosts(prev => {
            const existingIndex = prev.findIndex(post => post.id === newPost.id);
            
            if (existingIndex !== -1) {
              // Replace existing post
              const updatedVisiblePosts = [...prev];
              updatedVisiblePosts[existingIndex] = newPost;
              return updatedVisiblePosts;
            } else {
              // Add new post at the beginning
              return [newPost, ...prev.slice(0, -1)];
            }
          });
        }

        // Show notification for new posts (not from current user)
        if (newPost.author.id !== getCurrentUserId()) {
          showToast(`New post: ${newPost.title}`, 'info');
        }
      } else {
        console.log('[FORUM] Post does not match current filters');
      }
    };

    // Handle post updates/deletions
    const handlePostUpdate = (data: { postId: string; action: string }) => {
      if (data.action === 'deleted') {
        setPosts(prev => prev.filter(post => post.id !== data.postId));
        setVisiblePosts(prev => prev.filter(post => post.id !== data.postId));
      }
    };

    // Handle forum errors
    const handleForumError = (error: any) => {
      showToast(error.message || 'Forum error occurred', 'error');
    };

    // Handle vote updates from other users
    const handleVoteUpdate = (data: { postId: string; voteData: any }) => {
      console.log('[FORUM] Received vote update for post:', data.postId, data.voteData);
      
      // Only update if it's not from the current user (to avoid conflicts with optimistic updates)
      const currentUserId = getCurrentUserId();
      if (data.voteData.userId === currentUserId) {
        console.log('[FORUM] Vote update is from current user, skipping');
        return;
      }

      setPosts(prev => 
        prev.map(post => {
          if (post.id === data.postId) {
            const updatedVotes = [...post.votes];
            
            if (data.voteData.removed) {
              // Remove vote
              const voteIndex = updatedVotes.findIndex(v => v.userId === data.voteData.userId);
              if (voteIndex !== -1) {
                updatedVotes.splice(voteIndex, 1);
              }
            } else {
              // Add or update vote
              const existingVoteIndex = updatedVotes.findIndex(v => v.userId === data.voteData.userId);
              if (existingVoteIndex !== -1) {
                updatedVotes[existingVoteIndex] = data.voteData;
              } else {
                updatedVotes.push(data.voteData);
              }
            }
            
            return { ...post, votes: updatedVotes };
          }
          return post;
        })
      );

      setVisiblePosts(prev => 
        prev.map(post => {
          if (post.id === data.postId) {
            const updatedVotes = [...post.votes];
            
            if (data.voteData.removed) {
              // Remove vote
              const voteIndex = updatedVotes.findIndex(v => v.userId === data.voteData.userId);
              if (voteIndex !== -1) {
                updatedVotes.splice(voteIndex, 1);
              }
            } else {
              // Add or update vote
              const existingVoteIndex = updatedVotes.findIndex(v => v.userId === data.voteData.userId);
              if (existingVoteIndex !== -1) {
                updatedVotes[existingVoteIndex] = data.voteData;
              } else {
                updatedVotes.push(data.voteData);
              }
            }
            
            return { ...post, votes: updatedVotes };
          }
          return post;
        })
      );
    };

    // Set up event listeners
    console.log('[FORUM] Setting up socket event listeners');
    socket.on('newForumPost', handleNewPost);
    socket.on('forumPostUpdated', handlePostUpdate);
    socket.on('forumVoteUpdated', handleVoteUpdate);
    socket.on('forumError', handleForumError);
    socket.on('forumJoined', (data) => {
      console.log('[FORUM] Successfully joined forum:', data);
    });

    // Cleanup on unmount
    return () => {
      socket.off('newForumPost', handleNewPost);
      socket.off('forumPostUpdated', handlePostUpdate);
      socket.off('forumVoteUpdated', handleVoteUpdate);
      socket.off('forumError', handleForumError);
      if (universityId) {
        leaveForum(universityId);
      }
    };
  }, [socket, isConnected, userProfile, joinForum, leaveForum, filters, currentPage, showToast]);

  // Helper function to check if post matches current filters
  const matchesCurrentFilters = (post: ForumPost, currentFilters: ForumFilters): boolean => {
    // Always show posts if no search filter
    if (!currentFilters.search) return true;
    
    // Check if post matches search term
    const searchTerm = currentFilters.search.toLowerCase();
    return (
      post.title?.toLowerCase().includes(searchTerm) ||
      post.body.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      `${post.author.firstName} ${post.author.lastName}`.toLowerCase().includes(searchTerm)
    );
  };

  const fetchPosts = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.search && { search: filters.search }),
        ...(filters.filter !== 'all' && { filter: filters.filter })
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/forum/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newPosts = data.data.posts;
        
        if (reset) {
          setPosts(newPosts);
          setVisiblePosts(newPosts);
        } else {
          const updatedPosts = [...posts, ...newPosts];
          setPosts(updatedPosts);
          setVisiblePosts(updatedPosts);
        }
        
        setPagination(data.data.pagination);
        setHasMore(data.data.pagination.hasNextPage);
        setCurrentPage(page);
      } else {
        showToast('Failed to load forum posts', 'error');
      }
    } catch (error) {
      showToast('Error loading forum posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = () => {
    if (hasMore && !loading && pagination) {
      fetchPosts(currentPage + 1, false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showToast('Post deleted successfully', 'success');
        // Remove the post from both lists
        setPosts(prev => prev.filter(post => post.id !== postId));
        setVisiblePosts(prev => prev.filter(post => post.id !== postId));
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to delete post', 'error');
      }
    } catch (error) {
      showToast('Error deleting post', 'error');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'TUTO':
        return { icon: <AcademicCapIcon className="w-3 h-3 text-black fill-current" />, label: 'Tuto', color: 'text-blue-600' };
      case 'ROOKIE':
        return { icon: <BookOpenIcon className="w-3 h-3 text-black-500 fill-current" />, label: 'Rookie', color: 'text-green-600' };
      default:
        return { icon: <UserIcon className="w-3 h-3" />, label: 'User', color: 'text-gray-600' };
    }
  };



  const getVoteCount = (votes: any[]) => {
    const upvotes = votes.filter(v => v.voteType === 'UP').length;
    const downvotes = votes.filter(v => v.voteType === 'DOWN').length;
    return upvotes - downvotes;
  };

  const getUserVote = (votes: any[], userId: string) => {
    const userVote = votes.find(v => v.userId === userId);
    return userVote ? userVote.voteType : null;
  };

  // Navigate to individual post page
  const handlePostClick = (postId: string) => {
    router.push(`/forum/posts/${postId}`);
  };

  const handleVote = async (postId: string, voteType: 'UP' | 'DOWN') => {
    try {
      const currentUserId = getCurrentUserId();
      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) return;

      const currentUserVote = getUserVote(currentPost.votes, currentUserId);
      
      // Optimistic update
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const updatedVotes = [...post.votes];
          
          // Remove existing vote if any
          const existingVoteIndex = updatedVotes.findIndex(v => v.userId === currentUserId);
          if (existingVoteIndex !== -1) {
            updatedVotes.splice(existingVoteIndex, 1);
          }
          
          // Add new vote if different from current
          if (currentUserVote !== voteType) {
            updatedVotes.push({
              voteType,
              userId: currentUserId,
            });
          }
          
          return {
            ...post,
            votes: updatedVotes,
          };
        }
        return post;
      });
      
      setPosts(updatedPosts);
      
      // Also update visiblePosts to ensure immediate UI update
      setVisiblePosts(prev => 
        prev.map(post => {
          if (post.id === postId) {
            const updatedVotes = [...post.votes];
            
            // Remove existing vote if any
            const existingVoteIndex = updatedVotes.findIndex(v => v.userId === currentUserId);
            if (existingVoteIndex !== -1) {
              updatedVotes.splice(existingVoteIndex, 1);
            }
            
            // Add new vote if different from current
            if (currentUserVote !== voteType) {
              updatedVotes.push({
                voteType,
                userId: currentUserId,
              });
            }
            
            return {
              ...post,
              votes: updatedVotes,
            };
          }
          return post;
        })
      );

      // Make API call
      if (currentUserVote === voteType) {
        // Remove vote
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/forum/votes`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
          },
          body: JSON.stringify({ postId }),
        });
      } else {
        // Create/update vote
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/forum/votes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
          },
          body: JSON.stringify({ postId, voteType }),
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update on error
      fetchPosts(1, true);
    }
  };

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
              {/* Dashboard link - responsive styling */}
              {userLoading ? (
                // Show loading state - use stored preference or default
                <Link 
                  href={`/dashboard/${typeof window !== 'undefined' ? (localStorage.getItem('lastUsedDashboard') || 'tuto') : 'tuto'}`} 
                  className="text-gray-400 font-normal tracking-tight text-xs md:text-sm hover:text-gray-600 transition-colors"
                >
                  Dashboard
                </Link>
              ) : isBothUser ? (
                // For BOTH users, show smart default
                <Link 
                  href={`/dashboard/${lastUsedDashboard}`} 
                  className="text-gray-400 font-normal tracking-tight text-xs md:text-sm hover:text-gray-600 transition-colors"
                >
                  {lastUsedDashboard === 'tuto' ? 'Tuto Dashboard' : 'Rookie Dashboard'}
                </Link>
              ) : shouldShowTutoDashboard ? (
                <Link href="/dashboard/tuto" className="text-gray-400 font-normal tracking-tight text-xs md:text-sm hover:text-gray-600 transition-colors">
                  Tuto Dashboard
                </Link>
              ) : (
                <Link href="/dashboard/rookie" className="text-gray-400 font-normal tracking-tight text-xs md:text-sm hover:text-gray-600 transition-colors">
                  Rookie Dashboard
                </Link>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              </button>
              <button 
                className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-full focus:outline-none"
                aria-label="Log out"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('user');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                  }
                  window.location.href = '/auth/login';
                }}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 pr-6 py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-sm md:text-lg lg:text-xl font-medium text-gray-700 tracking-tight">Forum</h1>
          <p className="text-xs md:text-base font-medium text-gray-500 tracking-tight italic font-serif">Ask questions, share knowledge, and connect with your academic community.</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-2 pb-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions, topics, or users..."
                className="w-full pl-10 pr-4 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs md:text-sm backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-4">
              {[
                { key: 'all', label: 'All Questions' },
                { key: 'following', label: 'Following' },
                { key: 'popular', label: 'Popular' },
            
                { key: 'my-posts', label: 'My Posts' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilters(prev => ({ ...prev, filter: filter.key as any }))}
                  className={`px-3 py-1.5 text-gray-600 font-medium tracking-tight text-xs transition-all duration-200 ${
                    filters.filter === filter.key
                      ? 'text-gray-800 font-semibold border-b-2 border-gray-600'
                      : 'hover:text-gray-800 hover:font-medium'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Create Post Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 md:px-6 py-2 md:py-3 bg-gray-600 text-white rounded-lg text-[10px] md:text-xs font-semibold font-medium tracking-tight hover:bg-gray-700 transition-colors flex items-center gap-1 md:gap-2 border-0"
            >
                              <PlusIcon className="w-4 h-4" />
              Ask a Question
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-0">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-6 border-b border-gray-100 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : visiblePosts.length === 0 ? (
            <div className="py-12 text-center border-b border-gray-100">
              <div className="text-gray-400 mb-4">
                {filters.filter === 'my-posts' ? (
                  <SparklesIcon className="w-12 h-12 mx-auto" />
                ) : (
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto" />
                )}
              </div>
              <h3 className="text-gray-700 font-medium tracking-tight text-sm md:text-base lg:text-lg mb-2">
                {filters.filter === 'my-posts' ? 'No posts yet' : 'No posts yet'}
              </h3>
              <p className="text-gray-500 text-xs md:text-sm font-medium tracking-tight italic font-serif mb-4">
                {filters.filter === 'my-posts' 
                  ? "Ready to break the ice? Share your first question or thought with the community! 🚀"
                  : "Be the first to ask a question and start a discussion!"
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 md:px-6 py-2 md:py-3 bg-gray-600 text-white rounded-lg text-[10px] md:text-xs font-semibold font-medium tracking-tight hover:bg-gray-700 transition-colors border-0"
              >
                {filters.filter === 'my-posts' ? 'Ask Your First Question' : 'Ask Your First Question'}
              </button>
            </div>
          ) : (
            visiblePosts.map((post) => {
              const roleBadge = getRoleBadge(post.author.role);
              const voteCount = getVoteCount(post.votes);
              const currentUserId = getCurrentUserId();
              const userVote = getUserVote(post.votes, currentUserId);
              
              return (
                <div key={post.id} className="py-6 border-b border-gray-200">
                  <div className="flex items-start gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        className={`p-1 rounded transition-colors ${
                          userVote === 'UP' 
                            ? 'text-gray-600' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        onClick={() => handleVote(post.id, 'UP')}
                        disabled={!currentUserId}
                      >
                        {userVote === 'UP' ? (
                          <HandThumbUpIconSolid className="w-4 h-4" />
                        ) : (
                          <HandThumbUpIcon className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-lg font-semibold leading-tight text-gray-600">
                        {voteCount}
                      </span>
                      <button 
                        className={`p-1 rounded transition-colors ${
                          userVote === 'DOWN' 
                            ? 'text-gray-600' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        onClick={() => handleVote(post.id, 'DOWN')}
                        disabled={!currentUserId}
                      >
                        {userVote === 'DOWN' ? (
                          <HandThumbDownIconSolid className="w-4 h-4" />
                        ) : (
                          <HandThumbUpIcon className="w-4 h-4 rotate-180" />
                        )}
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1">
                          <ProfilePicture 
                            src={post.author.role === 'TUTO' ? post.author.tutoProfile?.selectedAvatar : post.author.rookieProfile?.selectedAvatar}
                            alt={`${post.author.firstName} ${post.author.lastName}`}
                            size="sm"
                            fallbackText={`${post.author.firstName} ${post.author.lastName}`}
                          />
                          <h3 
                            className="text-gray-900 font-medium tracking-tight text-sm md:text-base lg:text-lg hover:text-gray-700 cursor-pointer"
                            onClick={() => handlePostClick(post.id)}
                          >
                            {post.title}
                          </h3>
                        </div>
                        {/* Show delete button only for posts created by current user */}
                        {post.author.id === getCurrentUserId() && (
                          <button 
                            className="p-1 rounded transition-colors text-gray-900 hover:text-red-600 ml-2" 
                            title="Delete Post"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-gray-600 text-xs md:text-sm font-normal tracking-tight mb-4 line-clamp-2">
                        {post.body}
                      </p>

                      {/* Attachments */}
                      {post.attachments && post.attachments.length > 0 && (
                        <AttachmentDisplay attachments={post.attachments} size="forum" />
                      )}

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-900"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Post Meta */}
                      <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-900">
                        <div className="flex items-center gap-2 md:gap-4">
                          <span className="flex items-center gap-1">
                            {post.author.id === getCurrentUserId() ? (
                              <>By you <SparklesIcon className="w-3 h-3 text-yellow-500 fill-current" /></>
                            ) : (
                              <>By {post.author.firstName} {post.author.lastName} <span className="text-gray-500 text-[10px]">{roleBadge.icon}</span></>
                            )}
                          </span>
                          <span>•</span>
                          <DynamicTimeDisplay timestamp={post.createdAt} />
                          <span>•</span>
                          <span>{post._count.replies} replies</span>
                          <span>•</span>
                          <span>{post._count.comments} comments</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 md:gap-2">
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
              );
            })
          )}
        </div>

        {/* Load More Indicator */}
        {hasMore && !loading && visiblePosts.length > 0 && (
          <div className="text-center py-8">
            <button
              onClick={loadMorePosts}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Load More Posts
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {loading && visiblePosts.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading more posts...</span>
            </div>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={() => {
          setPosts([]);
          setVisiblePosts([]);
          fetchPosts(1, true);
        }}
      />
      
      {/* Edit Tags Modal */}
      {showEditTags && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Following Tags</h3>
              <button
                onClick={() => setShowEditTags(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Tags:</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {followingTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      #{tag}
                      <button
                        onClick={() => setFollowingTags(prev => prev.filter(t => t !== tag))}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Tag:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., calculus"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const newTag = e.currentTarget.value.trim().toLowerCase();
                        if (newTag && !followingTags.includes(newTag)) {
                          setFollowingTags(prev => [...prev, newTag]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const newTag = input.value.trim().toLowerCase();
                      if (newTag && !followingTags.includes(newTag)) {
                        setFollowingTags(prev => [...prev, newTag]);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditTags(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditTags(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 