import express from 'express';
import { uploadFiles, deleteFile } from '../controllers/fileUpload';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Upload files
router.post('/upload', authenticateToken, uploadFiles);

// Delete file
router.delete('/delete/:fileName', authenticateToken, deleteFile);

export default router; 