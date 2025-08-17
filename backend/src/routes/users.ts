import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getUserById, 
  getAllUsers, 
  getAvailableTutors, 
  addUserCourse, 
  updateUserCourseDetails,
  getRookieSubjects 
} from '../controllers/users';

const router = Router();

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Get available tutors (optionally filtered by course)
router.get('/tutors/available', getAvailableTutors);

// Add course expertise (for tutos) - requires authentication
router.post('/courses', authenticateToken, addUserCourse);

// Update course details (for tutos) - requires authentication
router.put('/courses/:courseId/details', authenticateToken, updateUserCourseDetails);

// Get rookie subjects (courses + general subjects) - requires authentication
router.get('/rookie/subjects', authenticateToken, getRookieSubjects);

// Health check
router.get('/health', (req, res) => {
  res.json({ message: 'Users routes are working!' });
});

export default router; 