"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '@/components/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onUndo?: () => void;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', onUndo?: () => void, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' = 'info', 
    onUndo?: () => void, 
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      id,
      message,
      type,
      onUndo,
      duration
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Listen for custom toast events from socket context
  useEffect(() => {
    const handleCustomToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      showToast(message, type as 'success' | 'error' | 'info');
    };

    window.addEventListener('showToast', handleCustomToast as EventListener);
    
    return () => {
      window.removeEventListener('showToast', handleCustomToast as EventListener);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div key={toast.id} style={{ transform: `translateY(${index * 80}px)` }}>
            <Toast
              message={toast.message}
              type={toast.type}
              onUndo={toast.onUndo}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 