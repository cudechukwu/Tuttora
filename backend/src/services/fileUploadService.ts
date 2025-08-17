import { bucket } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  private static readonly ALLOWED_PDF_TYPES = ['application/pdf'];
  private static readonly ALLOWED_TYPES = [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_PDF_TYPES];

  static validateFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
      return { isValid: false, error: 'Only JPG, PNG, and PDF files are allowed' };
    }

    return { isValid: true };
  }

  static async uploadFile(file: Express.Multer.File, userId: string): Promise<UploadedFile> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `forum/${userId}/${uuidv4()}.${fileExtension}`;
    
    const fileBuffer = file.buffer;
    const fileType = file.mimetype;
    
    try {
      // Upload to Firebase Storage
      const fileUpload = bucket.file(fileName);
      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: fileType,
          metadata: {
            originalName: file.originalname,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file publicly accessible
      await fileUpload.makePublic();

      // Get public URL
      const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      return {
        originalName: file.originalname,
        fileName,
        fileUrl,
        fileSize: file.size,
        fileType,
      };
    } catch (error) {
      console.error('Firebase upload error:', error);
      throw new Error('Failed to upload file to Firebase Storage. Please check your Firebase configuration.');
    }
  }

  static async uploadMultipleFiles(files: Express.Multer.File[], userId: string): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, userId));
    return Promise.all(uploadPromises);
  }

  static async deleteFile(fileName: string): Promise<void> {
    try {
      await bucket.file(fileName).delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error as file might already be deleted
    }
  }

  static async deleteMultipleFiles(fileNames: string[]): Promise<void> {
    const deletePromises = fileNames.map(fileName => this.deleteFile(fileName));
    await Promise.allSettled(deletePromises);
  }
} 