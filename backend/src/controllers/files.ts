import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import SocketService from '../services/socketService';

let socketService: SocketService;

export const setSocketService = (service: SocketService) => {
  socketService = service;
};

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

// Upload file to session
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Verify user has access to this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        rookieId: true,
        tutoId: true,
        status: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.rookieId !== userId && session.tutoId !== userId) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Get user info for uploadedBy field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    // Create file record in database
    const sessionFile = await prisma.sessionFile.create({
      data: {
        sessionId,
        fileName: file.originalname,
        fileUrl: `/api/files/${file.filename}`,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadedBy: `${user?.firstName} ${user?.lastName}`.trim()
      }
    });

    const fileData = {
      id: sessionFile.id,
      name: sessionFile.fileName,
      size: sessionFile.fileSize,
      type: sessionFile.fileType,
      url: sessionFile.fileUrl,
      uploadedAt: sessionFile.createdAt,
      uploadedBy: sessionFile.uploadedBy
    };

    // Notify other session participants
    if (socketService) {
      socketService.notifyFileUploaded(sessionId, fileData);
    }

    res.json({
      success: true,
      file: fileData
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

// Get files for a session
export const getSessionFiles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Verify user has access to this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        rookieId: true,
        tutoId: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.rookieId !== userId && session.tutoId !== userId) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Get all files for this session
    const files = await prisma.sessionFile.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' }
    });

    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.fileName,
      size: file.fileSize,
      type: file.fileType,
      url: file.fileUrl,
      uploadedAt: file.createdAt,
      uploadedBy: file.uploadedBy
    }));

    res.json({
      success: true,
      files: formattedFiles
    });

  } catch (error) {
    console.error('Error getting session files:', error);
    res.status(500).json({ error: 'Failed to get session files' });
  }
};

// Download file
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
};

// Delete file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { fileId } = req.params;

    // Get file info
    const file = await prisma.sessionFile.findUnique({
      where: { id: fileId },
      include: {
        session: {
          select: {
            rookieId: true,
            tutoId: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access to this session
    if (file.session.rookieId !== userId && file.session.tutoId !== userId) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    // Delete file from disk
    const filename = file.fileUrl.split('/').pop();
    if (filename) {
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    await prisma.sessionFile.delete({
      where: { id: fileId }
    });

    // Notify other session participants
    if (socketService) {
      socketService.notifyFileDeleted(file.sessionId, fileId);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

export { upload }; 