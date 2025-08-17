import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  createSessionRequest, 
  getAvailableRequests, 
  acceptSessionRequest, 
  rejectSessionRequest,
  unrejectSessionRequest,
  startSession,
  getActiveSession,
  updateSessionStatus,
  endSession,
  getSessionHistory,
  submitSessionFeedback,
  hideSessionFeedback,
  getMyRequests,
  withdrawRequest,
  getMyActiveSessions,
  getTutoActiveSessions,
  validateSessionAccess,
  getSessionWithTimer,
  saveSessionMessage,
  getSessionMessages,
  getSessionRoom,
  joinVideoCall,
  leaveVideoCall,
  getTutorInfo,
  cancelSessionDuringGracePeriod,
  joinSession,
  acceptSession,
  startSessionAsRookie
} from '../controllers/sessions';

const router = Router();

// Session Request Management
router.post('/requests', authenticateToken, createSessionRequest);
router.get('/requests', authenticateToken, getAvailableRequests);
router.post('/requests/:requestId/accept', authenticateToken, acceptSessionRequest);
router.post('/requests/:requestId/reject', authenticateToken, rejectSessionRequest);
router.delete('/requests/:requestId/reject', authenticateToken, unrejectSessionRequest);

// Session Status Management
router.post('/:sessionId/start', authenticateToken, startSession);
router.post('/:sessionId/start-as-rookie', authenticateToken, startSessionAsRookie);

// Rookie Session Management
router.get('/my-requests', authenticateToken, getMyRequests);
router.delete('/requests/:sessionId', authenticateToken, withdrawRequest);
router.get('/my-active-sessions', authenticateToken, getMyActiveSessions);

// Tuto Session Management
router.get('/tuto-active-sessions', authenticateToken, getTutoActiveSessions);

// Active Session Management
router.get('/active', authenticateToken, getActiveSession);
router.patch('/:sessionId/status', authenticateToken, updateSessionStatus);
router.post('/:sessionId/end', authenticateToken, endSession);

// Session Validation & Access
router.get('/:sessionId/validate', authenticateToken, validateSessionAccess);

// Session Persistence & Timer Management
router.get('/:sessionId/timer', authenticateToken, getSessionWithTimer);
router.post('/:sessionId/messages', authenticateToken, saveSessionMessage);
router.get('/:sessionId/messages', authenticateToken, getSessionMessages);

// Session History & Analytics
router.get('/history', authenticateToken, getSessionHistory);
router.post('/:sessionId/feedback', authenticateToken, submitSessionFeedback);
router.post('/:sessionId/hide-feedback', authenticateToken, hideSessionFeedback);

// Video Call Management
router.get('/:sessionId/room', authenticateToken, getSessionRoom);
router.post('/:sessionId/join-call', authenticateToken, joinVideoCall);
router.post('/:sessionId/leave-call', authenticateToken, leaveVideoCall);

// Grace Period & Tutor Info Management
router.get('/:sessionId/tutor-info', authenticateToken, getTutorInfo);
router.post('/:sessionId/cancel-grace-period', authenticateToken, cancelSessionDuringGracePeriod);
router.post('/:sessionId/accept', authenticateToken, acceptSession);
router.post('/:sessionId/join', authenticateToken, joinSession);

// Health check
router.get('/health', (req, res) => {
  res.json({ message: 'Sessions routes are working!' });
});

export default router; 