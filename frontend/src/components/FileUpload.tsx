'use client';

import React, { useState, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentIcon, PhotoIcon, DocumentTextIcon, XMarkIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface FileUploadProps {
  sessionId?: string;
  onFileUpload?: (file: UploadedFile) => void;
  uploadedFiles?: UploadedFile[];
  onFileDelete?: (fileId: string) => void;
  onFileView?: (file: UploadedFile) => void;
}

export default function FileUpload({ 
  sessionId,
  onFileUpload, 
  uploadedFiles = [], 
  onFileDelete, 
  onFileView 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported.`);
        continue;
      }

      try {
        // Upload to backend
        if (!sessionId) {
          alert('Session ID not available. Cannot upload file.');
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');
        if (!token) {
          alert('Authentication required. Please log in again.');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/files/session/${sessionId}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          alert(`Failed to upload ${file.name}: ${error.error}`);
          continue;
        }

        const result = await response.json();
        
        if (result.success && onFileUpload) {
          onFileUpload(result.file);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    
    setUploading(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <PhotoIcon className="w-4 h-4 text-green-600" />;
    } else if (type === 'application/pdf') {
      return <DocumentTextIcon className="w-4 h-4 text-green-600" />;
    } else if (type.startsWith('text/')) {
      return <DocumentTextIcon className="w-4 h-4 text-green-600" />;
    } else {
      return <DocumentIcon className="w-4 h-4 text-green-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if it's a valid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      // Extract filename from the stored URL (remove /api/files/ prefix)
      const filename = file.url.replace('/api/files/', '');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/files/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to download file: ${error.error}`);
        return;
      }

      // Create a blob from the response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">File Upload</h3>
            <p className="text-xs text-gray-700 mt-0.5">Upload images, documents, or other files to share with your session partner</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="flex-1 p-4">
        {/* Drag & Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-gray-400 bg-gray-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
          </p>
          <p className="text-xs text-gray-700 mb-3">
            Supports images, PDFs, documents up to 10MB
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleChange}
            className="hidden"
            accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Uploaded Files</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(file.size)} • {formatDate(file.uploadedAt)} • {file.uploadedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {onFileView && (
                      <button
                        onClick={() => onFileView(file)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="View file"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Download file"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    </button>
                    {onFileDelete && (
                      <button
                        onClick={() => onFileDelete(file.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete file"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between text-xs text-gray-900">
          <span>{uploadedFiles.length} file(s) uploaded</span>
          <span>Max file size: 10MB</span>
        </div>
      </div>
    </div>
  );
} 