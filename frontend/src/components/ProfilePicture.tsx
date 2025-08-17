'use client';

import Image from 'next/image';
import { UserIcon } from '@heroicons/react/24/outline';

interface ProfilePictureProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
}

export default function ProfilePicture({ 
  src, 
  alt = 'Profile picture', 
  size = 'md',
  className = '',
  fallbackText
}: ProfilePictureProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  if (!src) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 rounded-full flex items-center justify-center`}>
        {fallbackText ? (
          <span className={`text-gray-600 font-medium ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-base'}`}>
            {fallbackText.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <UserIcon className={`${iconSizes[size]} text-gray-400`} />
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-full overflow-hidden bg-gray-200`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={`${size === 'xs' ? '16px' : size === 'sm' ? '24px' : size === 'md' ? '32px' : size === 'lg' ? '40px' : '48px'}`}
      />
    </div>
  );
} 