import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  startScreenShare, 
  stopScreenShare, 
  joinScreenShare, 
  leaveScreenShare, 
  getActiveScreenShares,
  getScreenShareViewers
} from '../controllers/screenShare';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Start a new screen share
router.post('/sessions/:sessionId/start', startScreenShare);

// Stop a screen share
router.post('/sessions/:sessionId/:shareId/stop', stopScreenShare);

// Join a screen share as a viewer
router.post('/sessions/:sessionId/:shareId/join', joinScreenShare);

// Leave a screen share as a viewer
router.post('/sessions/:sessionId/:shareId/leave', leaveScreenShare);

// Get all active screen shares for a session
router.get('/sessions/:sessionId', getActiveScreenShares);

// Get viewers for a specific screen share
router.get('/sessions/:sessionId/:shareId/viewers', getScreenShareViewers);

export default router; 