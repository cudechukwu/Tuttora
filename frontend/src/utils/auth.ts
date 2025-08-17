import { useRouter } from 'next/navigation';

// Utility function to handle token expiry and graceful logout
export const handleTokenExpiry = async (error: any, showToast: (message: string, type: string) => void) => {
  // Check if error is due to token expiry (401) or invalid token
  if (error?.status === 401 || 
      error?.message?.includes('jwt expired') || 
      error?.message?.includes('invalid token') ||
      error?.message?.includes('unauthorized')) {
    
    // Try to refresh the token first
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: refreshToken
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update tokens in localStorage
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          console.log('Token refreshed automatically');
          return false; // Don't logout, token was refreshed
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    // If refresh failed or no refresh token, logout
    showToast('Session expired, please log in again', 'error');
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Small delay to ensure toast is shown before redirect
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 1500);
    
    return true; // Indicates token expiry was handled
  }
  
  return false; // Token expiry was not the issue
};

// Hook for handling API errors with token expiry detection
export const useAuthErrorHandler = () => {
  const router = useRouter();
  
  const handleApiError = async (error: any, showToast: (message: string, type: string) => void) => {
    // First check if it's a token expiry issue
    const shouldLogout = await handleTokenExpiry(error, showToast);
    if (shouldLogout) {
      return;
    }
    
    // Handle other errors
    if (error?.status === 429) {
      showToast('Too many requests. Please wait a moment and try again.', 'error');
    } else if (error?.message) {
      showToast(error.message, 'error');
    } else {
      showToast('An unexpected error occurred. Please try again.', 'error');
    }
  };
  
  return { handleApiError };
}; 