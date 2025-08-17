'use client';

import { useState } from 'react';
import { XMarkIcon, PlusIcon, ExclamationTriangleIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

interface PostFormData {
  title: string;
  body: string;
  tags: string[];
  urgency: 'GENERAL' | 'HIGH' | 'URGENT';
  postType: 'QUESTION' | 'DISCUSSION';
  attachments: string[]; // Array of Firebase Storage URLs
}

interface UploadedFile {
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    body: '',
    tags: [],
    urgency: 'GENERAL',
    postType: 'QUESTION',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.body.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/forum/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          tags: formData.tags,
          urgency: formData.urgency,
          postType: formData.postType,
          universityId: user.universityId,
          attachments: formData.attachments
        }),
      });

      if (response.ok) {
        showToast('Post created successfully!', 'success');
        onPostCreated();
        onClose();
        // Reset form
        setFormData({
          title: '',
          body: '',
          tags: [],
          urgency: 'GENERAL',
          postType: 'QUESTION',
          attachments: []
        });
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to create post', 'error');
      }
    } catch (error) {
      showToast('Error creating post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newFiles = data.data.files;
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...newFiles.map((f: UploadedFile) => f.fileUrl)]
        }));
        showToast('Files uploaded successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to upload files', 'error');
      }
    } catch (error) {
      showToast('Error uploading files', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (fileUrl: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileUrl !== fileUrl));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(url => url !== fileUrl)
    }));
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      showToast('File size exceeds 10MB limit', 'error');
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPG, PNG, and PDF files are allowed', 'error');
      return false;
    }

    return true;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-gray-700 font-medium tracking-tight text-base md:text-lg">
            {formData.postType === 'QUESTION' ? 'Ask a Question' : 'Start a Discussion'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Post Type Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Post Type
            </label>
            <div className="flex gap-3">
              {[
                { value: 'QUESTION', label: 'Question', icon: <QuestionMarkCircleIcon className="w-4 h-4" /> },
                { value: 'DISCUSSION', label: 'Discussion', icon: <ChatBubbleLeftRightIcon className="w-4 h-4" /> }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, postType: type.value as any }))}
                  className={`flex items-center gap-2 px-4 py-2 text-gray-700 font-medium tracking-tight text-xs border rounded-lg transition-all duration-300 ${
                    formData.postType === type.value
                      ? 'border-gray-500 bg-gray-50 text-gray-700 shadow-md'
                      : 'border-gray-200 bg-white/80 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={formData.postType === 'QUESTION' ? "What's your question?" : "What would you like to discuss?"}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-transparent text-sm"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Details *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Provide more context, details, or specific information..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-transparent text-sm resize-none"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attachments
            </label>
            <div className="space-y-3">
              {/* File Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      // Validate files before upload
                      const validFiles = Array.from(files).filter(validateFile);
                      if (validFiles.length > 0) {
                        handleFileUpload(files);
                      }
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center gap-2 px-4 py-2 text-gray-700 font-medium tracking-tight text-xs border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-300 cursor-pointer ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <PlusIcon className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Attach image or PDF'}
                </label>
                <span className="text-xs text-gray-500">
                  Max 10MB per file
                </span>
              </div>

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">Uploaded files:</p>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Image Preview */}
                      {file.fileType.startsWith('image/') && (
                        <div className="relative">
                          <img
                            src={file.fileUrl}
                            alt={file.originalName}
                            className="w-full h-auto max-h-64 object-contain bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.fileUrl)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {/* File Info */}
                      <div className="flex items-center justify-between p-3 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-700 font-medium">
                            {file.originalName}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(file.fileSize / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        {!file.fileType.startsWith('image/') && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.fileUrl)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tags (e.g., calculus, CS101)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2 text-gray-700 font-medium tracking-tight text-xs border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-300 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-blue-900"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Urgency Level
            </label>
            <div className="flex gap-3">
              {[
                { value: 'GENERAL', label: 'General', color: 'bg-gray-100 text-gray-700' },
                { value: 'HIGH', label: 'High Priority', color: 'bg-orange-100 text-orange-700' },
                { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' }
              ].map((urgency) => (
                <button
                  key={urgency.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgency: urgency.value as any }))}
                  className={`px-4 py-2 text-gray-700 font-medium tracking-tight text-xs border rounded-lg transition-all duration-300 ${
                    formData.urgency === urgency.value
                      ? 'border-gray-500 bg-gray-50 text-gray-700 shadow-md'
                      : 'border-gray-200 bg-white/80 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  {urgency.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl">
            <div className="flex items-start gap-2">
                              <ExclamationTriangleIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Tips for a great post:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Be specific and provide context</li>
                  <li>• Use relevant tags to help others find your post</li>
                  <li>• Check if your question has already been answered</li>
                  <li>• Be respectful and constructive</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg text-xs font-semibold font-medium tracking-tight hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.body.trim()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg text-xs font-semibold font-medium tracking-tight hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  {formData.postType === 'QUESTION' ? 'Ask Question' : 'Start Discussion'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 