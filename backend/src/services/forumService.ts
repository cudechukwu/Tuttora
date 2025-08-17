import { PrismaClient, ForumPostType, ForumUrgency, ForumVoteType, ForumReportReason, ForumReportStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateForumPostData {
  authorId: string;
  title?: string;
  body: string;
  postType: ForumPostType;
  parentPostId?: string;
  tags: string[];
  urgency: ForumUrgency;
  universityId: string;
  attachments?: string[]; // Array of Firebase Storage URLs
}

export interface CreateForumCommentData {
  postId: string;
  authorId: string;
  body: string;
  parentCommentId?: string;
}

export interface CreateForumVoteData {
  postId?: string;
  commentId?: string;
  userId: string;
  voteType: ForumVoteType;
}

export interface CreateForumReportData {
  postId: string;
  reporterId: string;
  reason: ForumReportReason;
  description?: string;
}

export interface ForumPostFilters {
  universityId?: string;
  tags?: string[];
  urgency?: ForumUrgency;
  postType?: ForumPostType;
  search?: string;
  page?: number;
  limit?: number;
  filter?: 'all' | 'following' | 'popular' | 'saved' | 'my-posts';
  authorId?: string; // For filtering by specific author
}

export class ForumService {
  // Create a new forum post
  async createPost(data: CreateForumPostData) {
    return await prisma.forumPost.create({
      data: {
        authorId: data.authorId,
        title: data.title,
        body: data.body,
        postType: data.postType,
        parentPostId: data.parentPostId,
        tags: data.tags,
        urgency: data.urgency,
        universityId: data.universityId,
        attachments: data.attachments || [],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            rookieProfile: {
              select: {
                selectedAvatar: true,
              },
            },
            tutoProfile: {
              select: {
                selectedAvatar: true,
              },
            },
          },
        },
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: true,
        _count: {
          select: {
            replies: true,
            comments: true,
            votes: true,
          },
        },
      },
    });
  }

  // Get forum posts with filtering and pagination - optimized for thousands of posts
  async getPosts(filters: ForumPostFilters = {}) {
    const {
      universityId,
      tags,
      urgency,
      postType,
      search,
      filter,
      authorId,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    if (universityId) {
      where.universityId = universityId;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (urgency) {
      where.urgency = urgency;
    }

    if (postType) {
      where.postType = postType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Handle new filter types
    if (filter === 'my-posts' && authorId) {
      where.authorId = authorId;
    }

    // For 'popular' filter, we'll use a hot score algorithm
    // For 'saved' filter, we'll need to implement saved posts functionality later
    // For 'following' filter, we'll need to implement following functionality later

    // Handle popular filter with hot ranking algorithm
    if (filter === 'popular') {
      const posts = await prisma.forumPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          body: true,
          postType: true,
          tags: true,
          urgency: true,
          attachments: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true,
              rookieProfile: {
                select: {
                  selectedAvatar: true,
                },
              },
              tutoProfile: {
                select: {
                  selectedAvatar: true,
                },
              },
            },
          },
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          votes: {
            select: {
              voteType: true,
              userId: true,
            },
          },
          _count: {
            select: {
              replies: true,
              comments: true,
              votes: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: limit * 3, // Get more posts for hot score calculation
      });

      // Calculate hot scores and sort
      const postsWithHotScores = posts.map(post => {
        const upvotes = post.votes.filter(vote => vote.voteType === 'UP').length;
        const downvotes = post.votes.filter(vote => vote.voteType === 'DOWN').length;
        const hotScore = this.calculateHotScore(upvotes, downvotes, post.createdAt);
        
        return {
          ...post,
          hotScore,
          upvotes,
          downvotes,
        };
      });

      // Sort by hot score and return top posts
      const sortedPosts = postsWithHotScores
        .sort((a, b) => b.hotScore - a.hotScore)
        .slice(0, limit);

      return {
        posts: sortedPosts,
        pagination: {
          page,
          limit,
          total: sortedPosts.length,
          totalPages: Math.ceil(sortedPosts.length / limit),
          hasNextPage: false, // Popular posts don't support pagination
          hasPreviousPage: page > 1,
        },
      };
    }

    // Optimized query with parallel execution for better performance
    // Using select instead of include for better performance with large datasets
    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          body: true,
          postType: true,
          tags: true,
          urgency: true,
          attachments: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true,
              rookieProfile: {
                select: {
                  selectedAvatar: true,
                },
              },
              tutoProfile: {
                select: {
                  selectedAvatar: true,
                },
              },
            },
          },
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          votes: {
            select: {
              voteType: true,
              userId: true,
            },
          },
          _count: {
            select: {
              replies: true,
              comments: true,
              votes: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.forumPost.count({ where }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Get a single forum post with all its data
  // Helper function to recursively fetch nested replies
  private async getNestedReplies(commentId: string) {
    const replies = await prisma.forumComment.findMany({
      where: { parentCommentId: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            rookieProfile: {
              select: {
                selectedAvatar: true,
              },
            },
            tutoProfile: {
              select: {
                selectedAvatar: true,
              },
            },
          },
        },
        votes: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Recursively fetch nested replies for each reply
    for (const reply of replies) {
      const nestedReplies = await this.getNestedReplies(reply.id);
      (reply as any).replies = nestedReplies;
    }

    return replies;
  }

  async getPost(postId: string) {
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            rookieProfile: {
              select: {
                selectedAvatar: true,
              },
            },
            tutoProfile: {
              select: {
                selectedAvatar: true,
              },
            },
          },
        },
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                rookieProfile: {
                  select: {
                    selectedAvatar: true,
                  },
                },
                tutoProfile: {
                  select: {
                    selectedAvatar: true,
                  },
                },
              },
            },
            votes: true,
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: [
            { isAccepted: 'desc' },
            { createdAt: 'asc' },
          ],
        },
        comments: {
          where: {
            parentCommentId: null, // Only get top-level comments
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                rookieProfile: {
                  select: {
                    selectedAvatar: true,
                  },
                },
                tutoProfile: {
                  select: {
                    selectedAvatar: true,
                  },
                },
              },
            },
            votes: true,
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        votes: true,
        _count: {
          select: {
            replies: true,
            comments: true,
            votes: true,
          },
        },
      },
    });

    if (post) {
      // Recursively fetch nested replies for each top-level comment
      for (const comment of post.comments) {
        const nestedReplies = await this.getNestedReplies(comment.id);
        (comment as any).replies = nestedReplies;
      }
    }

    return post;
  }

  // Update a forum post
  async updatePost(postId: string, authorId: string, data: Partial<CreateForumPostData>) {
    return await prisma.forumPost.update({
      where: {
        id: postId,
        authorId, // Ensure only the author can update
      },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: true,
        _count: {
          select: {
            replies: true,
            comments: true,
            votes: true,
          },
        },
      },
    });
  }

  // Soft delete a forum post
  async deletePost(postId: string, authorId: string) {
    return await prisma.forumPost.update({
      where: {
        id: postId,
        authorId, // Ensure only the author can delete
      },
      data: {
        isDeleted: true,
      },
    });
  }

  // Create a forum comment
  async createComment(data: CreateForumCommentData) {
    return await prisma.forumComment.create({
      data: {
        postId: data.postId,
        authorId: data.authorId,
        body: data.body,
        parentCommentId: data.parentCommentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            rookieProfile: {
              select: {
                selectedAvatar: true,
              },
            },
            tutoProfile: {
              select: {
                selectedAvatar: true,
              },
            },
          },
        },
        votes: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });
  }

  // Helper function to recursively delete all nested replies
  private async deleteNestedReplies(commentId: string) {
    // Find all replies to this comment
    const replies = await prisma.forumComment.findMany({
      where: { parentCommentId: commentId },
      select: { id: true },
    });

    // Recursively delete all nested replies
    for (const reply of replies) {
      await this.deleteNestedReplies(reply.id);
    }

    // Delete votes for this comment
    await prisma.forumVote.deleteMany({
      where: { commentId },
    });

    // Delete the comment itself
    await prisma.forumComment.delete({
      where: { id: commentId },
    });
  }

  // Delete a forum comment with cascading delete
  async deleteComment(commentId: string, userId: string) {
    // First check if the comment exists and user has permission to delete it
    const comment = await prisma.forumComment.findFirst({
      where: {
        id: commentId,
        authorId: userId, // Only allow author to delete
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            rookieProfile: {
              select: {
                selectedAvatar: true,
              },
            },
            tutoProfile: {
              select: {
                selectedAvatar: true,
              },
            },
          },
        },
        votes: true,
      },
    });

    if (!comment) {
      return null; // Comment not found or user doesn't have permission
    }

    // Delete the comment and all its nested replies recursively
    await this.deleteNestedReplies(commentId);

    return comment;
  }

  // Create or update a vote
  async createVote(data: CreateForumVoteData) {
    const { postId, commentId, userId, voteType } = data;

    // Check if user already voted
    const existingVote = await prisma.forumVote.findFirst({
      where: {
        userId,
        ...(postId ? { postId } : {}),
        ...(commentId ? { commentId } : {}),
      },
    });

    if (existingVote) {
      // If same vote type, remove the vote (toggle off)
      if (existingVote.voteType === voteType) {
        await prisma.forumVote.delete({
          where: {
            id: existingVote.id,
          },
        });
        return { removed: true, userId };
      } else {
        // Update existing vote to different type
        return await prisma.forumVote.update({
          where: {
            id: existingVote.id,
          },
          data: {
            voteType,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });
      }
    } else {
      // Create new vote
      return await prisma.forumVote.create({
        data: {
          postId,
          commentId,
          userId,
          voteType,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    }
  }

  // Remove a vote
  async removeVote(postId: string | undefined, commentId: string | undefined, userId: string) {
    const where: any = { userId };
    if (postId) where.postId = postId;
    if (commentId) where.commentId = commentId;

    return await prisma.forumVote.deleteMany({
      where,
    });
  }

  // Mark an answer as accepted
  async markAnswerAccepted(postId: string, answerId: string, authorId: string) {
    // First, unaccept any previously accepted answers
    await prisma.forumPost.updateMany({
      where: {
        parentPostId: postId,
        isAccepted: true,
      },
      data: {
        isAccepted: false,
      },
    });

    // Then accept the new answer
    return await prisma.forumPost.update({
      where: {
        id: answerId,
        parentPostId: postId, // Ensure it's actually an answer to this question
      },
      data: {
        isAccepted: true,
      },
    });
  }

  // Create a report
  async createReport(data: CreateForumReportData) {
    return await prisma.forumReport.create({
      data: {
        postId: data.postId,
        reporterId: data.reporterId,
        reason: data.reason,
        description: data.description,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  // Get all reports for admin moderation
  async getReports(status?: ForumReportStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return await prisma.forumReport.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Resolve a report
  async resolveReport(reportId: string, resolverId: string, status: ForumReportStatus) {
    return await prisma.forumReport.update({
      where: { id: reportId },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: resolverId,
      },
    });
  }

  // Get all available tags
  async getTags(universityId?: string) {
    const where: any = { isDeleted: false };
    if (universityId) {
      where.universityId = universityId;
    }

    const posts = await prisma.forumPost.findMany({
      where,
      select: { tags: true },
    });

    const allTags = posts.flatMap(post => post.tags);
    const uniqueTags = [...new Set(allTags)];
    
    return uniqueTags.sort();
  }

  // Get vote statistics for a post or comment
  async getVoteStats(targetId: string, targetType: 'post' | 'comment') {
    const votes = await prisma.forumVote.findMany({
      where: targetType === 'post' 
        ? { postId: targetId }
        : { commentId: targetId },
    });

    const upvotes = votes.filter(v => v.voteType === 'UP').length;
    const downvotes = votes.filter(v => v.voteType === 'DOWN').length;
    
    return {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      totalVotes: votes.length,
    };
  }

  // Calculate hot score using Reddit-like algorithm
  private calculateHotScore(upvotes: number, downvotes: number, createdAt: Date): number {
    const score = upvotes - downvotes;
    const order = Math.log10(Math.max(Math.abs(score), 1));
    const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
    const seconds = (Date.now() - createdAt.getTime()) / 1000;
    const hotScore = sign * order + seconds / 45000; // 45000 seconds = 12.5 hours
    return hotScore;
  }

  // Get popular posts with hot ranking algorithm
  async getPopularPosts(universityId?: string, limit: number = 10) {
    const where: any = {
      isDeleted: false,
    };

    if (universityId) {
      where.universityId = universityId;
    }

    const posts = await prisma.forumPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        body: true,
        postType: true,
        tags: true,
        urgency: true,
        attachments: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: {
          select: {
            voteType: true,
            userId: true,
          },
        },
        _count: {
          select: {
            replies: true,
            comments: true,
            votes: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit * 2, // Get more posts to calculate hot scores
    });

    // Calculate hot scores and sort
    const postsWithHotScores = posts.map(post => {
      const upvotes = post.votes.filter(vote => vote.voteType === 'UP').length;
      const downvotes = post.votes.filter(vote => vote.voteType === 'DOWN').length;
      const hotScore = this.calculateHotScore(upvotes, downvotes, post.createdAt);
      
      return {
        ...post,
        hotScore,
        upvotes,
        downvotes,
      };
    });

    // Sort by hot score and return top posts
    return postsWithHotScores
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, limit);
  }
}

export default new ForumService(); 