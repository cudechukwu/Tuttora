import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadFile, getSessionFiles, downloadFile, deleteFile, upload } from '../controllers/files';

const router = Router();

// Protected routes - require authentication
router.use(authenticateToken);

// Upload file to session
router.post('/session/:sessionId/upload', upload.single('file'), uploadFile);

// Get all files for a session
router.get('/session/:sessionId', getSessionFiles);

// Download file
router.get('/:filename', downloadFile);

// Delete file
router.delete('/:fileId', deleteFile);

export default router; 