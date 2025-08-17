import { Router } from 'express';
import { register, login, refreshToken, logout, getProfile, markProfileCompleted } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({ 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/profile-completed', authenticateToken, markProfileCompleted);

export default router; 