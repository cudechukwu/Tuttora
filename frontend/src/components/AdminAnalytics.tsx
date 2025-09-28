'use client';

import { useState, useEffect } from 'react';

interface AdminAnalytics {
  totalUsers: number;
  totalTutos: number;
  totalRookies: number;
  totalBothRole: number;
  usersRegisteredToday: number;
  usersRegisteredThisWeek: number;
  usersRegisteredThisMonth: number;
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  totalUniversities: number;
  totalCourses: number;
  registrationTrend: {
    date: string;
    count: number;
  }[];
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/dashboard/admin-analytics`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403) {
          setError('Access Denied: You do not have admin privileges to view this dashboard.');
          setIsAdmin(false);
        } else if (response.status === 401) {
          setError('Authentication Required: Please log in to access the admin dashboard.');
        } else {
          setError(errorData.message || errorData.error || 'Failed to fetch analytics');
        }
        return;
      }

      const data = await response.json();
      setAnalytics(data.data);
      setIsAdmin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    const isAccessDenied = isAdmin === false;
    const isAuthError = error.includes('Authentication Required');
    
    return (
      <div className={`border rounded-lg p-8 text-center max-w-2xl mx-auto mt-8 ${
        isAccessDenied 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="mb-4">
          {isAccessDenied ? (
            <div className="text-6xl mb-4">🚫</div>
          ) : isAuthError ? (
            <div className="text-6xl mb-4">🔐</div>
          ) : (
            <div className="text-6xl mb-4">❌</div>
          )}
        </div>
        
        <h2 className={`text-xl font-semibold mb-3 ${
          isAccessDenied ? 'text-yellow-800' : 'text-red-800'
        }`}>
          {isAccessDenied 
            ? 'Admin Access Required' 
            : isAuthError 
            ? 'Authentication Required'
            : 'Error Loading Dashboard'
          }
        </h2>
        
        <p className={`mb-4 ${
          isAccessDenied ? 'text-yellow-700' : 'text-red-600'
        }`}>
          {error}
        </p>
        
        {isAccessDenied && (
          <p className="text-sm text-yellow-600 mb-4">
            Contact the system administrator if you believe you should have access to this dashboard.
          </p>
        )}
        
        {isAuthError && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Please log in with your admin account to access the dashboard.
            </p>
            <a 
              href="/auth/login" 
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        )}
        
        {!isAccessDenied && !isAuthError && (
          <button 
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🔄 Retry
          </button>
        )}
      </div>
    );
  }

  if (!analytics) {
    return <div>No data available</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 TuttoPassa Analytics</h1>
        
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.totalUsers}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Tutors</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.totalTutos}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Rookies</h3>
            <p className="text-3xl font-bold text-purple-600">{analytics.totalRookies}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">Both Roles</h3>
            <p className="text-3xl font-bold text-orange-600">{analytics.totalBothRole}</p>
          </div>
        </div>

        {/* Registration Trends */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 Registration Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">Today</h4>
              <p className="text-2xl font-bold text-blue-600">{analytics.usersRegisteredToday}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">This Week</h4>
              <p className="text-2xl font-bold text-green-600">{analytics.usersRegisteredThisWeek}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">This Month</h4>
              <p className="text-2xl font-bold text-purple-600">{analytics.usersRegisteredThisMonth}</p>
            </div>
          </div>
        </div>

        {/* Session Statistics */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📚 Session Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">Total Sessions</h4>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalSessions}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">Completed</h4>
              <p className="text-2xl font-bold text-green-600">{analytics.completedSessions}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">Active Now</h4>
              <p className="text-2xl font-bold text-orange-600">{analytics.activeSessions}</p>
            </div>
          </div>
        </div>

        {/* Platform Content */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🏫 Platform Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">Universities</h4>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalUniversities}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-700">Courses</h4>
              <p className="text-2xl font-bold text-green-600">{analytics.totalCourses}</p>
            </div>
          </div>
        </div>

        {/* Registration Trend Chart (Simple) */}
        {analytics.registrationTrend && analytics.registrationTrend.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Registration Trend (Last 30 Days)</h2>
            <div className="overflow-x-auto">
              <div className="flex items-end space-x-2 h-32">
                {analytics.registrationTrend.slice(0, 15).map((day, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 rounded-t min-w-[20px]"
                      style={{ 
                        height: `${Math.max(day.count * 20, 4)}px`,
                        maxHeight: '100px'
                      }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left">
                      {day.date.split('-').slice(1).join('/')}
                    </span>
                    <span className="text-xs font-medium text-blue-600">{day.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button 
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
