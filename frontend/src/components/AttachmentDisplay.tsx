'use client';

import { useState } from 'react';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface AttachmentDisplayProps {
  attachments: string[];
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'forum';
}

export default function AttachmentDisplay({ attachments, className = "", size = 'large' }: AttachmentDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isImage = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const isPDF = (url: string): boolean => {
    return url.toLowerCase().includes('.pdf');
  };

  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    if (isImage(url)) return 'image';
    if (isPDF(url)) return 'pdf';
    return 'other';
  };

  const getFileName = (url: string): string => {
    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    // Remove query parameters
    return filename.split('?')[0];
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <div className="space-y-3">
          {attachments.map((attachment, index) => {
            const fileType = getFileType(attachment);
            const fileName = getFileName(attachment);

            if (fileType === 'image') {
              const sizeClasses = {
                small: 'max-w-xs md:max-w-sm lg:max-w-md h-auto max-h-32 md:max-h-40 lg:max-h-48',
                medium: 'max-w-sm md:max-w-md lg:max-w-lg h-auto max-h-48 md:max-h-56 lg:max-h-64',
                large: 'max-w-sm md:max-w-lg lg:max-w-2xl h-auto max-h-64 md:max-h-80 lg:max-h-[700px]',
                forum: 'w-56 h-32 md:w-72 md:h-40 lg:w-96 lg:h-48 object-cover rounded-lg'
              };

              return (
                <div key={index} className="inline-block">
                  <img
                    src={attachment}
                    alt={`Attachment ${index + 1}`}
                    className={`${sizeClasses[size]} object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity`}
                    onClick={() => handleImageClick(attachment)}
                  />
                </div>
              );
            }

            if (fileType === 'pdf') {
              return (
                <div
                  key={index}
                  className="inline-block max-w-md h-16 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => window.open(attachment, '_blank')}
                >
                  <div className="flex items-center gap-2 px-3">
                    <DocumentIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700 truncate">{fileName}</span>
                  </div>
                </div>
              );
            }

            // Default for other file types
            return (
              <div
                key={index}
                className="inline-block max-w-md h-16 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => window.open(attachment, '_blank')}
              >
                <div className="flex items-center gap-2 px-3">
                  <DocumentIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700 truncate">{fileName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
} 