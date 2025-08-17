import { Router } from 'express';
import { getDepartments, getCoursesByDepartment, getCourseById, searchCourses } from '../controllers/courses';

const router = Router();

// Get all departments
router.get('/departments', getDepartments);

// Get courses by department
router.get('/department/:department', getCoursesByDepartment);

// Get course by ID
router.get('/:id', getCourseById);

// Search courses
router.get('/search/all', searchCourses);

// Health check
router.get('/health', (req, res) => {
  res.json({ message: 'Courses routes are working!' });
});

export default router; 