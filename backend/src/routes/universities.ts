import { Router } from 'express';
import { getAllUniversities, getUniversityById, createUniversity } from '../controllers/universities';

const router = Router();

// GET /api/universities - Get all universities
router.get('/', getAllUniversities);

// GET /api/universities/:id - Get university by ID
router.get('/:id', getUniversityById);

// POST /api/universities - Create new university
router.post('/', createUniversity);

export default router; 