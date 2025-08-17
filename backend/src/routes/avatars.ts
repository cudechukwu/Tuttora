import express from 'express';
import { getAvatars, getAvatarById } from '../controllers/avatars';

const router = express.Router();

// GET /api/avatars - Get all avatars (with optional category filter)
router.get('/', getAvatars);

// GET /api/avatars/:id - Get specific avatar by ID
router.get('/:id', getAvatarById);

export default router; 