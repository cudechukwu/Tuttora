import { Request, Response } from 'express';
import multer from 'multer';
import { FileUploadService } from '../services/fileUploadService';
import { authenticateToken } from '../middleware/auth';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const uploadFiles = async (req: Request, res: Response) => {
  try {
    // Use multer to handle file uploads
    upload.array('files', 5)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message,
        });
      }

      const files = req.files as Express.Multer.File[];
      const userId = (req as any).user?.id;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided',
        });
      }

      // Validate each file
      for (const file of files) {
        const validation = FileUploadService.validateFile(file);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: validation.error,
          });
        }
      }

      // Upload files to Firebase Storage
      const uploadedFiles = await FileUploadService.uploadMultipleFiles(files, userId);

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        data: {
          files: uploadedFiles,
        },
      });
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const userId = (req as any).user?.id;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'File name is required',
      });
    }

    // Delete file from Firebase Storage
    await FileUploadService.deleteFile(fileName);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}; 