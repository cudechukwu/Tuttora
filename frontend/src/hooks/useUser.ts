import { useState, useEffect } from 'react';

export interface UserProfile {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    profileCompleted: boolean;
    university?: {
      id: string;
      name: string;
    };
  };
  tutoProfile?: any;
  rookieProfile?: any;
}

export const useUser = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check if we're on an onboarding page
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/onboarding')) {
        console.log('Skipping profile fetch on onboarding page');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUserProfile(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (!userProfile) return '';
    
    // Try to get preferred name from role-specific profile first
    if (userProfile.tutoProfile?.preferredName) {
      return userProfile.tutoProfile.preferredName;
    }
    if (userProfile.rookieProfile?.preferredName) {
      return userProfile.rookieProfile.preferredName;
    }
    
    // Fall back to first name + last name
    if (userProfile.user.firstName && userProfile.user.lastName) {
      return `${userProfile.user.firstName} ${userProfile.user.lastName}`;
    }
    
    // Fall back to just first name
    if (userProfile.user.firstName) {
      return userProfile.user.firstName;
    }
    
    // Fall back to username
    if (userProfile.user.username) {
      return userProfile.user.username;
    }
    
    // Last resort
    return 'User';
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return {
    userProfile,
    loading,
    error,
    fetchUserProfile,
    getUserDisplayName,
  };
}; 