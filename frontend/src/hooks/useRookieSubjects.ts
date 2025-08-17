import { useState, useEffect } from 'react';
import { useAuthErrorHandler } from '@/utils/auth';

interface Subject {
  id: string;
  code: string;
  title: string;
  department: string;
  displayName: string;
}

interface RookieSubjectsData {
  userCourses: Subject[];
  generalSubjects: Subject[];
  allSubjects: Subject[];
}

export const useRookieSubjects = (showToast?: (message: string, type: string) => void) => {
  const [subjects, setSubjects] = useState<RookieSubjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleApiError } = useAuthErrorHandler();

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/rookie/subjects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        const error = {
          status: response.status,
          message: errorData.message || errorData.error || 'Failed to fetch subjects'
        };
        
        if (showToast) {
          handleApiError(error, showToast);
        }
        throw new Error(error.message);
      }

      const data = await response.json();
      setSubjects(data.data);
    } catch (err) {
      console.error('Error fetching rookie subjects:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects
  };
}; 