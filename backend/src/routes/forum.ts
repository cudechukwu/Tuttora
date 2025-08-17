import express from 'express';
import forumController from '../controllers/forum';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all forum routes
router.use(authenticateToken);

// Forum Posts
router.post('/posts', forumController.createPost);
router.get('/posts', forumController.getPosts);
router.get('/posts/:postId', forumController.getPost);
router.put('/posts/:postId', forumController.updatePost);
router.delete('/posts/:postId', forumController.deletePost);

// Forum Comments
router.post('/comments', forumController.createComment);
router.delete('/comments/:commentId', forumController.deleteComment);

// Forum Votes
router.post('/votes', forumController.createVote);
router.delete('/votes', forumController.removeVote);

// Forum Reports
router.post('/reports', forumController.createReport);
router.get('/reports', forumController.getReports);
router.put('/reports/:reportId', forumController.resolveReport);

// Forum Tags
router.get('/tags', forumController.getTags);

// Forum Search
router.get('/search', forumController.searchPosts);

// Popular Posts
router.get('/popular', forumController.getPopularPosts);

// Answer Acceptance
router.post('/posts/:postId/accept-answer', forumController.markAnswerAccepted);

export default router; 