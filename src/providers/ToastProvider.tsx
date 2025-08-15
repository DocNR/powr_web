/**
 * Toast Provider
 * 
 * Provides toast notification functionality throughout the app using Radix UI Toast.
 * Manages toast state and provides methods to show/hide notifications.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastProvider as RadixToastProvider, ToastViewport, ToastNotification, setToastDispatch } from '@/components/powr-ui/primitives/Toast';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (title: string, type?: 'success' | 'error' | 'info', description?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    title: string, 
    type: 'success' | 'error' | 'info' = 'info',
    description?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = {
      id,
      type,
      title,
      description,
      duration
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Initialize the global toast dispatch function
  useEffect(() => {
    const dispatch = (toast: { title: string; description?: string; variant?: 'success' | 'error' | 'info' | 'default' }) => {
      showToast(toast.title, toast.variant === 'default' ? 'info' : toast.variant, toast.description);
    };
    setToastDispatch(dispatch);
    
    // Cleanup on unmount
    return () => setToastDispatch(null);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearAllToasts }}>
      <RadixToastProvider>
        {children}
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
        <ToastViewport />
      </RadixToastProvider>
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
