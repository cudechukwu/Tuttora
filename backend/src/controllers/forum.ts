import { Request, Response } from 'express';
import forumService, { 
  CreateForumPostData, 
  CreateForumCommentData, 
  CreateForumVoteData, 
  CreateForumReportData,
  ForumPostFilters 
} from '../services/forumService';
import { ForumPostType, ForumUrgency, ForumVoteType, ForumReportReason, ForumReportStatus } from '@prisma/client';

export class ForumController {
  // Create a new forum post
  async createPost(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const {
        title,
        body,
        postType,
        parentPostId,
        tags,
        urgency,
        universityId,
        attachments,
      } = req.body;

      // Validate required fields
      if (!body || !postType || !tags || !urgency || !universityId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: body, postType, tags, urgency, universityId',
        });
      }

      // Validate post type
      if (!Object.values(ForumPostType).includes(postType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post type',
        });
      }

      // Validate urgency
      if (!Object.values(ForumUrgency).includes(urgency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid urgency level',
        });
      }

      // For questions, title is required
      if (postType === 'QUESTION' && !title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required for questions',
        });
      }

      const postData: CreateForumPostData = {
        authorId: userId,
        title,
        body,
        postType,
        parentPostId,
        tags: Array.isArray(tags) ? tags : [tags],
        urgency,
        universityId,
        attachments: Array.isArray(attachments) ? attachments : attachments ? [attachments] : [],
      };

      const post = await forumService.createPost(postData);

      // Broadcast new post to connected users via WebSocket
      if (req.app.locals.socketService) {
        console.log('[FORUM] Broadcasting new post:', post.id, 'to university:', universityId);
        req.app.locals.socketService.broadcastNewPost(post, universityId, userId);
      } else {
        console.warn('[FORUM] SocketService not available in app.locals');
      }

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error('Error creating forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create forum post',
      });
    }
  }

  // Get forum posts with filtering and pagination
  async getPosts(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const {
        universityId,
        tags,
        urgency,
        postType,
        search,
        filter,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: ForumPostFilters = {
        universityId: universityId as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        urgency: urgency as ForumUrgency,
        postType: postType as ForumPostType,
        search: search as string,
        filter: filter as 'all' | 'following' | 'popular' | 'saved' | 'my-posts',
        authorId: filter === 'my-posts' ? userId : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await forumService.getPosts(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error getting forum posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get forum posts',
      });
    }
  }

  // Get a single forum post
  async getPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      const post = await forumService.getPost(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found',
        });
      }

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error('Error getting forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get forum post',
      });
    }
  }

  // Update a forum post
  async updatePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = (req as any).user.id;
      const { title, body, tags, urgency } = req.body;

      const updateData: Partial<CreateForumPostData> = {};
      if (title !== undefined) updateData.title = title;
      if (body !== undefined) updateData.body = body;
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [tags];
      if (urgency !== undefined) updateData.urgency = urgency;

      const post = await forumService.updatePost(postId, userId, updateData);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found or you do not have permission to update it',
        });
      }

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error('Error updating forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update forum post',
      });
    }
  }

  // Delete a forum post (soft delete)
  async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = (req as any).user.id;

      const post = await forumService.deletePost(postId, userId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found or you do not have permission to delete it',
        });
      }

      // Broadcast post deletion to connected users via WebSocket
      if (req.app.locals.socketService) {
        req.app.locals.socketService.broadcastPostUpdate(postId, 'deleted', post.universityId);
      }

      res.status(200).json({
        success: true,
        message: 'Forum post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete forum post',
      });
    }
  }

  // Create a forum comment
  async createComment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { postId, body, parentCommentId } = req.body;

      if (!postId || !body) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: postId, body',
        });
      }

      const commentData: CreateForumCommentData = {
        postId,
        authorId: userId,
        body,
        parentCommentId,
      };

      const comment = await forumService.createComment(commentData);

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      console.error('Error creating forum comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create forum comment',
      });
    }
  }

  // Delete a forum comment
  async deleteComment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { commentId } = req.params;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: commentId',
        });
      }

      const deletedComment = await forumService.deleteComment(commentId, userId);

      if (!deletedComment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or you do not have permission to delete it',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
        data: deletedComment,
      });
    } catch (error) {
      console.error('Error deleting forum comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete forum comment',
      });
    }
  }

  // Create or update a vote
  async createVote(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { postId, commentId, voteType } = req.body;

      if (!voteType || (!postId && !commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: voteType and either postId or commentId',
        });
      }

      if (!Object.values(ForumVoteType).includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vote type',
        });
      }

      const voteData: CreateForumVoteData = {
        postId,
        commentId,
        userId,
        voteType,
      };

      const result = await forumService.createVote(voteData);

      // Broadcast vote update to connected users via WebSocket
      if (req.app.locals.socketService && postId) {
        try {
          // Get the post to find its university
          const post = await forumService.getPost(postId);
          if (post) {
            console.log('[FORUM] Broadcasting vote update for post:', postId, 'to university:', post.universityId);
            req.app.locals.socketService.broadcastVoteUpdate(postId, result, post.universityId);
          }
        } catch (broadcastError) {
          console.error('[FORUM] Error broadcasting vote update:', broadcastError);
        }
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error creating vote:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vote',
      });
    }
  }

  // Remove a vote
  async removeVote(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { postId, commentId } = req.body;

      if (!postId && !commentId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: either postId or commentId',
        });
      }

      await forumService.removeVote(postId, commentId, userId);

      // Broadcast vote removal to connected users via WebSocket
      if (req.app.locals.socketService && postId) {
        try {
          // Get the post to find its university
          const post = await forumService.getPost(postId);
          if (post) {
            console.log('[FORUM] Broadcasting vote removal for post:', postId, 'to university:', post.universityId);
            req.app.locals.socketService.broadcastVoteUpdate(postId, { removed: true, userId }, post.universityId);
          }
        } catch (broadcastError) {
          console.error('[FORUM] Error broadcasting vote removal:', broadcastError);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Vote removed successfully',
      });
    } catch (error) {
      console.error('Error removing vote:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove vote',
      });
    }
  }

  // Mark an answer as accepted
  async markAnswerAccepted(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { postId, answerId } = req.body;

      if (!postId || !answerId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: postId, answerId',
        });
      }

      const result = await forumService.markAnswerAccepted(postId, answerId, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Post or answer not found, or you do not have permission to accept this answer',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Answer marked as accepted successfully',
      });
    } catch (error) {
      console.error('Error marking answer as accepted:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark answer as accepted',
      });
    }
  }

  // Create a report
  async createReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { postId, reason, description } = req.body;

      if (!postId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: postId, reason',
        });
      }

      if (!Object.values(ForumReportReason).includes(reason)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report reason',
        });
      }

      const reportData: CreateForumReportData = {
        postId,
        reporterId: userId,
        reason,
        description,
      };

      const report = await forumService.createReport(reportData);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create report',
      });
    }
  }

  // Get all reports (admin only)
  async getReports(req: Request, res: Response) {
    try {
      const { status } = req.query;

      if (status && !Object.values(ForumReportStatus).includes(status as ForumReportStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report status',
        });
      }

      const reports = await forumService.getReports(status as ForumReportStatus);

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reports',
      });
    }
  }

  // Resolve a report (admin only)
  async resolveReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { reportId } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(ForumReportStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Missing or invalid status',
        });
      }

      const report = await forumService.resolveReport(reportId, userId, status);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error resolving report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve report',
      });
    }
  }

  // Get all available tags
  async getTags(req: Request, res: Response) {
    try {
      const { universityId } = req.query;

      const tags = await forumService.getTags(universityId as string);

      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (error) {
      console.error('Error getting tags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tags',
      });
    }
  }

  // Search forum posts
  async searchPosts(req: Request, res: Response) {
    try {
      const { q, universityId, tags, page = 1, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const filters: ForumPostFilters = {
        search: q as string,
        universityId: universityId as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await forumService.getPosts(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error searching forum posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search forum posts',
      });
    }
  }

  // Get popular posts
  async getPopularPosts(req: Request, res: Response) {
    try {
      const { universityId, limit = 10 } = req.query;

      const posts = await forumService.getPopularPosts(
        universityId as string,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      console.error('Error getting popular posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get popular posts',
      });
    }
  }


}

export default new ForumController(); 