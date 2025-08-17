'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SocketProvider } from '@/contexts/SocketContext';

// Simple wrapper component for the layout
export const SocketProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  // Disable socket connections on onboarding pages to prevent auth errors
  const isOnboardingPage = pathname?.startsWith('/onboarding');
  
  if (isOnboardingPage) {
    return <>{children}</>;
  }
  
  return <SocketProvider>{children}</SocketProvider>;
}; 