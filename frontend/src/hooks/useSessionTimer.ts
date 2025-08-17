import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  startTime: Date | null;
  duration: number; // in minutes
  remainingTime: number; // in seconds
  isActive: boolean;
  isPaused: boolean;
}

interface UseSessionTimerProps {
  sessionId: string;
  isSessionActive: boolean;
  userRole: 'TUTO' | 'ROOKIE';
}

export const useSessionTimer = ({ sessionId, isSessionActive, userRole }: UseSessionTimerProps) => {
  const [timerState, setTimerState] = useState<TimerState>({
    startTime: null,
    duration: 30, // default 30 minutes
    remainingTime: 30 * 60, // default 30 minutes in seconds
    isActive: false,
    isPaused: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to avoid stale closures in useEffect
  const timerStateRef = useRef(timerState);
  const sessionIdRef = useRef(sessionId);
  
  // Update refs when state changes
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);
  
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Load timer state from backend
  const loadTimerState = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/timer`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No timer state exists yet, use defaults
          setTimerState({
            startTime: null,
            duration: 30,
            remainingTime: 30 * 60,
            isActive: false,
            isPaused: false
          });
          return;
        }
        throw new Error(`Failed to load timer state: ${response.statusText}`);
      }

      const data = await response.json();
      const timer = data.session.timer;
      
      // Use the timer state from backend
      setTimerState({
        startTime: timer.startTime ? new Date(timer.startTime) : null,
        duration: timer.duration || 30,
        remainingTime: timer.remainingTime || (timer.duration * 60),
        isActive: timer.isActive || false,
        isPaused: false
      });
    } catch (err) {
      console.error('Error loading timer state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timer state');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Start timer
  const startTimer = useCallback(async () => {
    if (!sessionId) return;

    // Don't start if already active
    if (timerState.isActive) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use different endpoints based on user role
      const endpoint = userRole === 'ROOKIE' ? 'start-as-rookie' : 'start';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionId}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.error || errorData.message || `Failed to start session: ${response.statusText}`);
      }

      console.log('Session started successfully');
      // Reload timer state to get updated start time
      await loadTimerState();
    } catch (err) {
      console.error('Error starting timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to start timer');
    }
  }, [sessionId, loadTimerState, userRole, timerState.isActive]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: true }));
  }, []);

  // Resume timer
  const resumeTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // End timer
  const endTimer = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/sessions/${sessionIdRef.current}/end`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      setTimerState(prev => ({ ...prev, isActive: false, remainingTime: 0 }));
    } catch (err) {
      console.error('Error ending timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to end timer');
    }
  }, []);

  // Load timer state on mount and when session becomes active
  useEffect(() => {
    if (sessionId) {
      loadTimerState();
    }
  }, [sessionId, loadTimerState]);

  // Reload timer state when session becomes active
  useEffect(() => {
    if (isSessionActive && sessionId && !timerState.isActive) {
      loadTimerState();
    }
  }, [isSessionActive, sessionId, timerState.isActive, loadTimerState]);

  // Also reload when session becomes active regardless of current timer state
  useEffect(() => {
    if (isSessionActive && sessionId) {
      loadTimerState();
    }
  }, [isSessionActive, sessionId, loadTimerState]);

  // Timer countdown effect - only run when timer is active and not paused
  useEffect(() => {
    if (!timerState.isActive || timerState.isPaused || timerState.remainingTime <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimerState(prev => {
        const newRemainingTime = Math.max(0, prev.remainingTime - 1);
        
        // Auto-end session when time runs out
        if (newRemainingTime === 0) {
          // Use setTimeout to avoid calling endTimer during state update
          setTimeout(() => {
            endTimer();
          }, 0);
        }
        
        return {
          ...prev,
          remainingTime: newRemainingTime
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isActive, timerState.isPaused, timerState.remainingTime, endTimer]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = useCallback(() => {
    const totalSeconds = timerState.duration * 60;
    return Math.max(0, Math.min(100, ((totalSeconds - timerState.remainingTime) / totalSeconds) * 100));
  }, [timerState.duration, timerState.remainingTime]);

  return {
    timerState,
    loading,
    error,
    startTimer,
    pauseTimer,
    resumeTimer,
    endTimer,
    formatTime,
    progressPercentage,
    isExpired: timerState.remainingTime === 0,
    canStart: userRole === 'TUTO' && !timerState.isActive && timerState.remainingTime > 0,
    canPause: timerState.isActive && !timerState.isPaused,
    canResume: timerState.isActive && timerState.isPaused,
    canEnd: timerState.isActive
  };
}; 