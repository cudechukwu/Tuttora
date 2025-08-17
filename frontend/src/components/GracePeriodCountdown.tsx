'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface GracePeriodCountdownProps {
  gracePeriodEnd: string;
  onExpired?: () => void;
  className?: string;
}

export default function GracePeriodCountdown({ 
  gracePeriodEnd, 
  onExpired, 
  className = '' 
}: GracePeriodCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!gracePeriodEnd) return;

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(gracePeriodEnd);
      const remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));

      setTimeRemaining(remaining);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        onExpired?.();
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [gracePeriodEnd, onExpired, isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-600'; // Last minute - red
    if (timeRemaining <= 180) return 'text-yellow-600'; // Last 3 minutes - yellow
    return 'text-blue-600'; // Normal - blue
  };

  const getBackgroundColor = () => {
    if (timeRemaining <= 60) return 'bg-red-50 border-red-200'; // Last minute - red
    if (timeRemaining <= 180) return 'bg-yellow-50 border-yellow-200'; // Last 3 minutes - yellow
    return 'bg-blue-50 border-blue-200'; // Normal - blue
  };

  if (isExpired) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span className="text-sm font-medium text-red-700">
          Grace period expired
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 ${getBackgroundColor()} rounded-lg ${className}`}>
      <Clock className={`w-4 h-4 ${getTimeColor()}`} />
      <span className={`text-sm font-medium ${getTimeColor()}`}>
        {formatTime(timeRemaining)}
      </span>
      <span className="text-xs text-gray-600">
        to start session
      </span>
    </div>
  );
} 