'use client';

import React from 'react';
import { RookieSessionProvider } from '@/contexts/RookieSessionContext';
import { useToast } from '@/contexts/ToastContext';

interface RookieSessionProviderWrapperProps {
  children: React.ReactNode;
}

export default function RookieSessionProviderWrapper({ children }: RookieSessionProviderWrapperProps) {
  const { showToast } = useToast();

  // Create a wrapper function to match the expected signature
  const handleShowToast = (message: string, type: string) => {
    showToast(message, type as 'success' | 'error' | 'info');
  };

  return (
    <RookieSessionProvider showToast={handleShowToast}>
      {children}
    </RookieSessionProvider>
  );
}

