import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  updateAcademicProfile,
  getAcademicProfile,
  updateCourse,
  updateSkill,
  deleteSkill,
  getValidAcademicStandings,
  getValidGrades,
  testEndpoint,
  addCourse,
  updateCourseProficiency,
  deleteCourse,
  getAvailableCourses,
  getValidProficiencyLevels,
  getValidSemesters,
  getValidYears
} from '../controllers/academic';

const router = express.Router();

// Academic profile routes (protected)
router.put('/profile', authenticateToken, updateAcademicProfile);
router.get('/profile', authenticateToken, getAcademicProfile);

// Course search and validation routes (public) - MUST come before parameterized routes
router.get('/courses/available', getAvailableCourses);
router.get('/courses/proficiency-levels', (req, res) => {
  console.log('Proficiency levels endpoint hit!');
  getValidProficiencyLevels(req, res);
});
router.get('/courses/proficiency-levels/', (req, res) => {
  console.log('Proficiency levels endpoint hit! (with trailing slash)');
  getValidProficiencyLevels(req, res);
});
router.get('/courses/semesters', (req, res) => {
  console.log('Semesters endpoint hit!');
  getValidSemesters(req, res);
});
router.get('/courses/semesters/', (req, res) => {
  console.log('Semesters endpoint hit! (with trailing slash)');
  getValidSemesters(req, res);
});
router.get('/courses/years', (req, res) => {
  console.log('Years endpoint hit!');
  getValidYears(req, res);
});
router.get('/courses/years/', (req, res) => {
  console.log('Years endpoint hit! (with trailing slash)');
  getValidYears(req, res);
});

// Course management routes (protected) - MUST come after specific routes
router.put('/courses/:courseId', authenticateToken, updateCourse);
router.post('/courses', authenticateToken, addCourse);
router.put('/courses/:courseId/proficiency', authenticateToken, updateCourseProficiency);
router.delete('/courses/:courseId', authenticateToken, deleteCourse);

// Skills management routes (protected)
router.put('/skills', authenticateToken, updateSkill);
router.delete('/skills/:skillName', authenticateToken, deleteSkill);

// Validation routes (public)
router.get('/valid-standings', getValidAcademicStandings);
router.get('/valid-grades', getValidGrades);
router.get('/test', testEndpoint);

export default router; 