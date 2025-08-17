'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Users } from 'lucide-react';
import Image from 'next/image';

interface User {
  profileCompleted: boolean;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFocused, setIsFocused] = useState<Record<string, boolean>>({});
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Floating bubbles animation - positioned away from form
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string }>>([]);

  const handleAutoLogin = useCallback(async () => {
    const pendingLogin = localStorage.getItem('pendingLogin');
    
    if (!pendingLogin) {
      setAutoLoginAttempted(true);
      return;
    }

    try {
      const loginData = JSON.parse(pendingLogin);
      const now = Date.now();
      const timeDiff = now - loginData.timestamp;
      
      // Only auto-login if the registration was within the last 5 minutes
      if (timeDiff > 5 * 60 * 1000) {
        localStorage.removeItem('pendingLogin');
        setAutoLoginAttempted(true);
        return;
      }

      // Validate login data structure
      if (!loginData.email || !loginData.password) {
        localStorage.removeItem('pendingLogin');
        setAutoLoginAttempted(true);
        return;
      }

      setAutoLoginLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Clear pending login data
        localStorage.removeItem('pendingLogin');
        
        // Redirect based on user status
        const redirectPath = getRedirectDestination(data.user);
        router.push(redirectPath);
      } else {
        // Auto-login failed, show manual login form
        setFormData({
          email: loginData.email,
          password: loginData.password
        });
        setErrors({ general: 'Auto-login failed. Please log in manually.' });
        localStorage.removeItem('pendingLogin');
      }
    } catch {
      // Auto-login failed, show manual login form
      setErrors({ general: 'Auto-login failed. Please log in manually.' });
      localStorage.removeItem('pendingLogin');
    } finally {
      setAutoLoginLoading(false);
      setAutoLoginAttempted(true);
    }
  }, [router]);

  useEffect(() => {
    // Generate 4 translucent bubbles in brand colors positioned away from center
    const newBubbles = [
      { id: 0, x: 15, y: 20, size: 80, delay: 0, color: 'blue' },      // Top left - Blue
      { id: 1, x: 85, y: 15, size: 60, delay: 1, color: 'pink' },      // Top right - Pink
      { id: 2, x: 10, y: 75, size: 70, delay: 2, color: 'green' },     // Bottom left - Green
      { id: 3, x: 80, y: 80, size: 90, delay: 0.5, color: 'purple' }   // Bottom right - Purple
    ];
    setBubbles(newBubbles);

    // Check for auto-login
    const urlParams = new URLSearchParams(window.location.search);
    const shouldAutoLogin = urlParams.get('autoLogin') === 'true';
    
    if (shouldAutoLogin && !autoLoginAttempted) {
      handleAutoLogin();
    }
  }, [autoLoginAttempted, handleAutoLogin]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on user status
        const redirectPath = getRedirectDestination(data.user);
        router.push(redirectPath);
      } else {
        setErrors({ general: data.error || 'Invalid email or password' });
      }
    } catch {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFocus = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  // Helper function to determine redirect destination
  const getRedirectDestination = (user: User) => {
    // Check if user has completed profile setup using the backend flag
    const hasCompletedProfile = user.profileCompleted;
    
    if (!hasCompletedProfile) {
      // First time user - redirect to onboarding setup
      return `/onboarding?role=${user.role.toLowerCase()}`;
    } else {
      // Returning user - redirect to role-specific dashboard
      return `/dashboard/${user.role.toLowerCase()}`;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      backgroundImage: 'url(/images/landing/section/whitesection.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* White overlay for brightness - matching "Your Path to Academic Success" section */}
      <div className="absolute inset-0 bg-white/70 pointer-events-none"></div>

      {/* Floating Bubbles - Multi-colored translucent */}
      {bubbles.map((bubble) => {
        const colorClasses = {
          blue: 'bg-blue-400/20 border-blue-300/30',
          pink: 'bg-pink-400/20 border-pink-300/30',
          green: 'bg-green-400/20 border-green-300/30',
          purple: 'bg-purple-400/20 border-purple-300/30'
        };
        
        return (
          <div
            key={bubble.id}
            className={`absolute rounded-full backdrop-blur-sm border animate-pulse z-10 ${colorClasses[bubble.color as keyof typeof colorClasses]}`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: '4s'
            }}
          />
        );
      })}

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center relative z-20">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Image
                  src="/images/logo/TP_Logo.png"
                  alt="Tuttora Logo"
                  width={88}
                  height={88}
                  className="drop-shadow-lg"
                />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2" style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#1f2937',
              fontWeight: '700'
            }}>
            Welcome Back
            </h1>
            <p className="text-base" style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#6b7280'
            }}>
              Sign in to continue your learning journey
          </p>
        </div>

        {/* Auto-login Loading State */}
        {autoLoginLoading && (
          <div className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-8 text-center relative z-20 shadow-xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Logging you in automatically...
                </h3>
                <p className="text-gray-700 text-sm">
                  Please wait while we sign you in from your recent registration
                </p>
              </div>
              <button
                onClick={handleAutoLogin}
                className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-colors border border-white/20"
              >
                Click here if it&apos;s taking too long
              </button>
            </div>
          </div>
        )}

        {/* Auto-login Success Message */}
        {!autoLoginLoading && autoLoginAttempted && !errors.general && (
          <div className="backdrop-blur-md bg-white/30 border border-white/20 rounded-xl p-4 mb-4 relative z-20 shadow-lg">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm text-gray-900 font-medium">
                  Welcome! You&apos;ve been automatically logged in from your registration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Login Prompt */}
        {!autoLoginLoading && autoLoginAttempted && errors.general && (
          <div className="backdrop-blur-md bg-white/30 border border-white/20 rounded-xl p-4 mb-4 relative z-20 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-medium">
                    Auto-login didn&apos;t work. Please log in manually below.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setErrors({});
                  setAutoLoginAttempted(false);
                }}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* Form Card - Only show when not auto-logging in */}
        {!autoLoginLoading && (
          <div className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 relative z-20 shadow-xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
          {errors.general && (
                <div className="backdrop-blur-sm bg-red-500/10 border border-red-300/30 rounded-xl p-3 animate-shake">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm text-red-700 font-medium">{errors.general}</div>
                  </div>
            </div>
          )}

          <div className="space-y-4">
                {/* Email Field */}
                <div className="relative">
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
                  <div className={`relative transition-all duration-300 ${
                    isFocused.email ? 'transform scale-105' : ''
                  }`}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                      className={`w-full px-3 py-2 pl-10 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm placeholder:text-gray-400 text-gray-900  ${
                        errors.email 
                          ? 'border-red-300 bg-red-500/10' 
                          : isFocused.email 
                            ? 'border-blue-700/60 bg-white/90' 
                            : 'border-white/30 bg-white/50 hover:border-white/50'
                      }`}
                  placeholder="student@university.edu"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                />
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                      isFocused.email ? 'text-blue-700/70' : 'text-gray-400'
                    }`} />
              </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-fadeIn">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.email}
                    </p>
                  )}
            </div>

                {/* Password Field */}
                <div className="relative">
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
                  <div className={`relative transition-all duration-300 ${
                    isFocused.password ? 'transform scale-105' : ''
                  }`}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                      className={`w-full px-3 py-2 pl-10 pr-10 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm placeholder:text-gray-400 text-gray-900 backdrop-blur-sm ${
                        errors.password 
                          ? 'border-red-300 bg-red-500/10' 
                          : isFocused.password 
                            ? 'border-blue-700/60 bg-white/90' 
                            : 'border-white/30 bg-white/50 hover:border-white/50'
                      }`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                />
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                      isFocused.password ? 'text-blue-700/70' : 'text-gray-400'
                    }`} />
                <button
                  type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-fadeIn">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.password}
                    </p>
                  )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
              />
                    <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-700">
                Remember me
              </label>
            </div>

                  <div className="text-xs">
                    <Link href="/auth/forgot-password" className="font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                      Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Sign In
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
            </button>
          </div>

          <div className="text-center">
                <p className="text-xs text-gray-600">
              Don&apos;t have an account?{' '}
                  <Link href="/auth/register" className="font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                    Create one now
              </Link>
            </p>
          </div>
        </form>
        </div>
        )}

          {/* Footer */}
          <div className="text-center relative z-20">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 backdrop-blur-md bg-white/30 border border-white/20 rounded-xl px-4 py-2 shadow-lg">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>Join 3,000+ students</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center">
                <Image
                  src="/images/logo/TP_Logo.png"
                  alt="Tuttora"
                  width={16}
                  height={16}
                  className="mr-1"
                />
                <span>50+ subjects covered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 