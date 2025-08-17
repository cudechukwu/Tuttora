'use client';

import { useState, useEffect } from 'react';

export default function AuthDebug() {
  const [authState, setAuthState] = useState({
    hasToken: false,
    token: '',
    user: null as any,
    tokenExpiry: null as Date | null
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (token) {
      try {
        // Decode JWT token to check expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        
        setAuthState({
          hasToken: true,
          token: token.substring(0, 20) + '...',
          user: user ? JSON.parse(user) : null,
          tokenExpiry: expiry
        });
      } catch (error) {
        setAuthState({
          hasToken: true,
          token: 'Invalid token',
          user: null,
          tokenExpiry: null
        });
      }
    }
  }, []);

  const testAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No token found');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      alert(`Profile API response: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const testSession = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No token found');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Test Subject',
          description: 'Test description for debugging',
          urgency: 'low'
        }),
      });

      const data = await response.json();
      alert(`Session API response: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1 mb-3">
        <div>Token: {authState.hasToken ? '✅' : '❌'}</div>
        <div>Token Preview: {authState.token}</div>
        <div>Expiry: {authState.tokenExpiry?.toLocaleString() || 'Unknown'}</div>
        <div>User: {authState.user ? '✅' : '❌'}</div>
      </div>
      <div className="space-y-2">
        <button 
          onClick={testAuth}
          className="w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Test Profile API
        </button>
        <button 
          onClick={testSession}
          className="w-full px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
        >
          Test Session API
        </button>
      </div>
    </div>
  );
} 