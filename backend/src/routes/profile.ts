import express = require('express');
import { 
  getProfile, 
  updateProfile, 
  validateProfile, 
  getValidMajors, 
  getValidYearsOfStudy,
  updateUserRole,
  saveOnboardingData
} from '../controllers/profile';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public endpoints (no authentication required)
router.get('/majors', getValidMajors);
router.get('/years-of-study', getValidYearsOfStudy);

// Protected endpoints (authentication required)
router.use(authenticateToken);

// Get user's profile data
router.get('/', getProfile);

// Update user's profile
router.put('/', updateProfile);

// Validate profile completion
router.get('/validate', validateProfile);

// Update user's role
router.patch('/role', updateUserRole);

// Save onboarding data
router.post('/onboarding', saveOnboardingData);

export default router; 