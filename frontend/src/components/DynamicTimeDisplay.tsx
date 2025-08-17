'use client';

import { useState, useEffect } from 'react';

interface DynamicTimeDisplayProps {
  timestamp: string;
  className?: string;
}

export default function DynamicTimeDisplay({ timestamp, className = '' }: DynamicTimeDisplayProps) {
  const [relativeTime, setRelativeTime] = useState<string>('');

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const updateTime = () => {
    const date = new Date(timestamp);
    setRelativeTime(getRelativeTime(date));
  };

  useEffect(() => {
    // Initial update
    updateTime();

    // Set up interval for updates
    const interval = setInterval(() => {
      updateTime();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <span className={className} title={new Date(timestamp).toLocaleString()}>
      {relativeTime}
    </span>
  );
} 