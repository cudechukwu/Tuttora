import express = require('express');
import { 
  getDashboardStats, 
  getSessionHistory, 
  getLeaderboard,
  awardTpoints,
  deductTpoints,
  getAdminAnalytics
} from '../controllers/dashboard';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Protected routes - require authentication
router.use(authenticateToken);

// Get user's dashboard statistics
router.get('/stats', getDashboardStats);

// Get user's session history with ratings and feedback
router.get('/session-history', getSessionHistory);

// Get admin analytics (user counts, platform statistics) - ADMIN ONLY
router.get('/admin-analytics', requireAdmin, getAdminAnalytics);

// Award Tpoints to user (admin functionality) - ADMIN ONLY
router.post('/award-tpoints', requireAdmin, awardTpoints);

// Deduct Tpoints from user - ADMIN ONLY
router.post('/deduct-tpoints', requireAdmin, deductTpoints);

// Public routes - no authentication required
// Get leaderboard (public)
router.get('/leaderboard', getLeaderboard);

export default router; 