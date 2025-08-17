import React, { useState, useEffect } from 'react';
import { useRookieSessionContext } from '@/contexts/RookieSessionContext';
import { useSocket } from '@/contexts/SocketContext';
import { setupTestAuth, checkUserAuth } from '@/utils/authHelper';

export default function RealTimeTestPanel() {
  const { socket, isConnected, isAuthenticated, reconnect } = useSocket();
  const { createRequest, requests, activeSessions } = useRookieSessionContext();
  const [authLoading, setAuthLoading] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  // Check authentication on client side
  useEffect(() => {
    setUserAuthenticated(checkUserAuth());
  }, []);

  const handleTestAuth = async () => {
    setAuthLoading(true);
    try {
      await setupTestAuth();
    } catch (error) {
      console.error('Test auth failed:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateTestRequest = async () => {
    setCreatingRequest(true);
    try {
      await createRequest({
        subject: 'Test Session',
        topic: 'Real-time Updates Testing',
        description: 'This is a test session to verify real-time updates work properly.',
        urgency: 'medium',
        courseId: null
      });
    } catch (error) {
      console.error('Failed to create test request:', error);
    } finally {
      setCreatingRequest(false);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
      <h3 className="text-gray-700 font-medium tracking-tight text-sm md:text-base mb-4">
        Real-time Updates Test Panel
      </h3>

      {/* Connection Status */}
      <div className="mb-4 space-y-2">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>WebSocket Connected:</span>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Socket Authenticated:</span>
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>User Authenticated:</span>
            <span className={userAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {userAuthenticated ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="space-y-3">
        {!userAuthenticated && (
          <button
            onClick={handleTestAuth}
            disabled={authLoading}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {authLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>🔐 Test Login</span>
              </>
            )}
          </button>
        )}

        {userAuthenticated && !isConnected && (
          <button
            onClick={reconnect}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄 Manual Reconnect</span>
          </button>
        )}

        {userAuthenticated && (
          <button
            onClick={handleCreateTestRequest}
            disabled={creatingRequest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creatingRequest ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                <span>Creating Request...</span>
              </>
            ) : (
              <>
                <span>📝 Create Test Session Request</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Status Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Requests:</span>
            <span className="font-medium">{requests.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Active Sessions:</span>
            <span className="font-medium">{activeSessions.length}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Testing Instructions:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>1. Click "Test Login" if not authenticated</p>
          <p>2. If WebSocket shows "❌ No", click "Manual Reconnect"</p>
          <p>3. Click "Create Test Session Request"</p>
          <p>4. Open another browser/tab and log in as a Tuto</p>
          <p>5. Accept the session request</p>
          <p>6. Watch for real-time updates here</p>
        </div>
      </div>
    </div>
  );
} 