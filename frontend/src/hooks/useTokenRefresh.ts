import { useCallback, useEffect, useRef } from 'react';

interface TokenRefreshResponse {
  message: string;
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const useTokenRefresh = () => {
  const isRefreshing = useRef(false);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing.current) {
      return false; // Already refreshing
    }

    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      return false; // No refresh token available
    }

    try {
      isRefreshing.current = true;
      
      const response = await fetch('http://localhost:5001/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: storedRefreshToken
        }),
      });

      if (response.ok) {
        const data: TokenRefreshResponse = await response.json();
        
        // Update tokens in localStorage
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('Token refreshed successfully');
        return true;
      } else {
        // Refresh token is invalid, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  const makeAuthenticatedRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token available');
    }

    // Make the request with current token
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If token expired, try to refresh and retry once
    if (response.status === 401) {
      const refreshSuccess = await refreshToken();
      
      if (refreshSuccess) {
        // Retry the request with new token
        const newToken = localStorage.getItem('accessToken');
        return fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      } else {
        // Refresh failed, throw error to trigger logout
        throw new Error('Authentication failed');
      }
    }

    return response;
  }, [refreshToken]);

  return {
    refreshToken,
    makeAuthenticatedRequest,
  };
}; 