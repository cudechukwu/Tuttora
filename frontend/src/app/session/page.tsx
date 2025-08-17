"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (sessionId) {
      // Redirect to new path format for backward compatibility
      router.replace(`/session/${sessionId}`);
    } else {
      // No sessionId provided, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [sessionId, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to session...</p>
      </div>
    </div>
  );
} 