import express = require('express');
import { 
  getDashboardStats, 
  getSessionHistory, 
  getLeaderboard,
  awardTpoints,
  deductTpoints
} from '../controllers/dashboard';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Protected routes - require authentication
router.use(authenticateToken);

// Get user's dashboard statistics
router.get('/stats', getDashboardStats);

// Get user's session history with ratings and feedback
router.get('/session-history', getSessionHistory);

// Award Tpoints to user (admin functionality)
router.post('/award-tpoints', awardTpoints);

// Deduct Tpoints from user
router.post('/deduct-tpoints', deductTpoints);

// Public routes - no authentication required
// Get leaderboard (public)
router.get('/leaderboard', getLeaderboard);

export default router; 