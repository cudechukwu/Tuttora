'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  ArrowRightIcon, 
  HeartIcon, 
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import CourseSelection from '@/components/CourseSelection';
import TutorCourseSelection from '@/components/TutorCourseSelection';

interface University {
  id: string;
  name: string;
  domain: string;
}

interface Course {
  id: string;
  code: string;
  number: string;
  title: string;
  department: string;
  credits: number;
  professor: string;
  term: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    universityId: '',
    role: 'ROOKIE' as 'ROOKIE' | 'TUTO'
  });
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFocused, setIsFocused] = useState<Record<string, boolean>>({});

  // Floating bubbles animation - positioned away from form
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string }>>([]);

  useEffect(() => {
    // Generate 4 translucent bubbles in brand colors positioned away from center
    const newBubbles = [
      { id: 0, x: 10, y: 10, size: 80, delay: 0, color: 'blue' },      // Top left - Blue
      { id: 1, x: 90, y: 15, size: 60, delay: 1, color: 'pink' },      // Top right - Pink
      { id: 2, x: 10, y: 75, size: 70, delay: 2, color: 'green' },     // Bottom left - Green
      { id: 3, x: 80, y: 80, size: 90, delay: 0.5, color: 'purple' }   // Bottom right - Purple
    ];
    setBubbles(newBubbles);
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      console.log('Fetching universities...');
      setUniversitiesLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/universities`);
      console.log('Universities response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Universities data:', data);
        setUniversities(data.data || data); // Handle both response formats
      } else {
        console.error('Failed to fetch universities:', response.status);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setUniversitiesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFocus = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          universityId: formData.universityId,
          role: formData.role,
          selectedCourses: selectedCourses.map(course => course.id),
          selectedDepartments: selectedDepartments
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Logging you in automatically...');
        
        // Store the registration data for automatic login
        localStorage.setItem('pendingLogin', JSON.stringify({
          email: formData.email,
          password: formData.password,
          timestamp: Date.now()
        }));
        
        // Clear form data for security
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          universityId: '',
          role: 'ROOKIE'
        });
        
        // Redirect to login page with auto-login parameter
        setTimeout(() => {
          router.push('/auth/login?autoLogin=true');
        }, 1500);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      backgroundImage: 'url(/images/landing/section/whitesection.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* White overlay for brightness - matching login page */}
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
            className={`absolute rounded-full backdrop-blur-sm border animate-pulse ${colorClasses[bubble.color as keyof typeof colorClasses]}`}
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

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-2/5 flex-col justify-center items-center p-8">
          <div className="max-w-sm text-center">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-secondary-50 rounded-2xl p-3 shadow-lg">
                  <Image
                    src="/images/logo/TP_Logo.png"
                    alt="Tuttora Logo"
                    width={72}
                    height={72}
                  />
                </div>
              </div>
            </div>
            
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
            Join Tuttora
            </h1>
            <p className="text-gray-600 text-base mb-6">
              Choose your role and start your academic journey
            </p>

            {/* Platform Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-xl font-bold text-primary-600 mb-1">3K+</div>
                <div className="text-xs text-gray-600">Students</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary-600 mb-1">50+</div>
                <div className="text-xs text-gray-600">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary-600 mb-1">24/7</div>
                <div className="text-xs text-gray-600">Support</div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <HeartIcon className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Community-driven learning</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <BoltIcon className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Real-time peer matching</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                  <Image
                    src="/images/logo/TP_Logo.png"
                    alt="Tuttora"
                    width={12}
                    height={12}
                  />
                </div>
                <span className="text-sm text-gray-700">Interactive whiteboard tools</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-lg">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-secondary-50 rounded-2xl p-2 shadow-lg">
                    <Image
                      src="/images/logo/TP_Logo.png"
                      alt="Tuttora Logo"
                      width={64}
                      height={64}
                    />
                  </div>
                </div>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                Join Tuttora
              </h1>
            </div>

            {/* Form Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
            {/* Role Selection */}
              <div className="mb-5">
                <h2 className="text-base font-semibold text-gray-700 mb-4 text-center">I want to join as:</h2>
                
              <div className="grid grid-cols-2 gap-3">
                  {/* Rookie Card */}
                  <div 
                    className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      formData.role === 'ROOKIE' 
                        ? 'ring-2 ring-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                        : 'bg-white/80 border-gray-200 hover:border-green-300'
                    } border rounded-xl p-3`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'ROOKIE' }))}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 ${
                        formData.role === 'ROOKIE' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <HeartIcon className={`w-3 h-3 ${formData.role === 'ROOKIE' ? 'text-green-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-xs font-semibold ${formData.role === 'ROOKIE' ? 'text-green-800' : 'text-gray-700'}`}>
                          Rookie
                        </h3>
                        <p className={`text-[10px] ${formData.role === 'ROOKIE' ? 'text-green-600' : 'text-gray-500'}`}>
                          Get help
                        </p>
                      </div>
                    </div>
                    
                    {/* Role Perks */}
                    <div className="space-y-1">
                      <div className="flex items-center text-[10px] text-gray-600">
                        <CheckCircleIcon className="w-2.5 h-2.5 text-green-500 mr-1 flex-shrink-0" />
                        Free peer support
                      </div>
                      <div className="flex items-center text-[10px] text-gray-600">
                        <CheckCircleIcon className="w-2.5 h-2.5 text-green-500 mr-1 flex-shrink-0" />
                        Real-time matching
                      </div>
                      <div className="flex items-center text-[10px] text-gray-600">
                        <CheckCircleIcon className="w-2.5 h-2.5 text-green-500 mr-1 flex-shrink-0" />
                        Earn Tpoints
                      </div>
                    </div>
                    
                    {formData.role === 'ROOKIE' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tutor Card */}
                  <div 
                    className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      formData.role === 'TUTO' 
                        ? 'ring-2 ring-pink-500/50 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300' 
                        : 'bg-white/80 border-gray-200 hover:border-pink-300'
                    } border rounded-xl p-3`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'TUTO' }))}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 ${
                        formData.role === 'TUTO' ? 'bg-pink-100' : 'bg-gray-100'
                      }`}>
                        <BoltIcon className={`w-3 h-3 ${formData.role === 'TUTO' ? 'text-pink-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-xs font-semibold ${formData.role === 'TUTO' ? 'text-pink-800' : 'text-gray-700'}`}>
                          Tutor
                        </h3>
                        <p className={`text-[10px] ${formData.role === 'TUTO' ? 'text-pink-600' : 'text-gray-500'}`}>
                          Help others
                        </p>
                      </div>
                    </div>
                    
                    {/* Role Perks */}
                    <div className="space-y-1">
                      <div className="flex items-center text-[10px] text-gray-600">
                        <CheckCircleIcon className="w-2.5 h-2.5 text-pink-500 mr-1 flex-shrink-0" />
                        Share knowledge
                      </div>
                      <div className="flex items-center text-[10px] text-gray-600">
                        <CheckCircleIcon className="w-2.5 h-2.5 text-pink-500 mr-1 flex-shrink-0" />
                        Build reputation
                      </div>
                      <div className="flex items-center text-[10px] text-gray-600">
                        <CheckCircleIcon className="w-2.5 h-2.5 text-pink-500 mr-1 flex-shrink-0" />
                        Unlock premium
                      </div>
                    </div>
                    
                    {formData.role === 'TUTO' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-pink-500 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Role switching note */}
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-[9px] text-blue-700 text-center">
                    Don't worry! You can easily switch between Rookie and Tutor modes anytime in your profile settings.
                  </p>
                </div>
              </div>

              {/* Registration Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div className="text-xs text-red-700 font-medium">{error}</div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-xs text-green-700 font-medium">{success}</div>
                    </div>
            </div>
                )}

            <div className="grid grid-cols-2 gap-3">
                  {/* First Name */}
                  <div className="relative">
                    <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className={`relative transition-all duration-300 ${
                      isFocused.firstName ? 'transform scale-105' : ''
                    }`}>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                        className={`w-full px-3 py-2 pl-8 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm ${
                          isFocused.firstName 
                            ? 'border-blue-700/60 bg-white' 
                            : 'border-gray-200 bg-white/80 hover:border-gray-300'
                        }`}
                        placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                        onFocus={() => handleFocus('firstName')}
                        onBlur={() => handleBlur('firstName')}
                />
                                      <UserIcon className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isFocused.firstName ? 'text-primary-500' : 'text-gray-400'
                }`} />
                    </div>
              </div>

                  {/* Last Name */}
                  <div className="relative">
                    <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className={`relative transition-all duration-300 ${
                      isFocused.lastName ? 'transform scale-105' : ''
                    }`}>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                        className={`w-full px-3 py-2 pl-8 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm ${
                          isFocused.lastName 
                            ? 'border-blue-700/60 bg-white' 
                            : 'border-gray-200 bg-white/80 hover:border-gray-300'
                        }`}
                        placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                        onFocus={() => handleFocus('lastName')}
                        onBlur={() => handleBlur('lastName')}
                />
                                      <UserIcon className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isFocused.lastName ? 'text-primary-500' : 'text-gray-400'
                }`} />
                    </div>
              </div>
            </div>

            {/* Email */}
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
                      className={`w-full px-3 py-2 pl-8 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm ${
                        isFocused.email 
                          ? 'border-blue-700/60 bg-white' 
                          : 'border-gray-200 bg-white/80 hover:border-gray-300'
                      }`}
                      placeholder="student@university.edu"
                value={formData.email}
                onChange={handleInputChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
              />
                                    <EnvelopeIcon className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isFocused.email ? 'text-primary-500' : 'text-gray-400'
                }`} />
                  </div>
            </div>

            {/* University Selection */}
                <div className="relative">
                  <label htmlFor="universityId" className="block text-xs font-semibold text-gray-700 mb-1">
                    University
                  </label>
                  <div className={`relative transition-all duration-300 ${
                    isFocused.universityId ? 'transform scale-105' : ''
                  }`}>
              <select
                id="universityId"
                name="universityId"
                required
                      className={`w-full px-3 py-2 pl-8 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none text-sm ${
                        isFocused.universityId 
                          ? 'border-blue-700/60 bg-white' 
                          : 'border-gray-200 bg-white/80 hover:border-gray-300'
                      }`}
                value={formData.universityId}
                onChange={handleInputChange}
                      onFocus={() => handleFocus('universityId')}
                      onBlur={() => handleBlur('universityId')}
                disabled={universitiesLoading}
              >
                <option value="">
                  {universitiesLoading ? 'Loading universities...' : 'Select your university'}
                </option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
                                    <BuildingOfficeIcon className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isFocused.universityId ? 'text-primary-500' : 'text-gray-400'
                }`} />
                  </div>
              {universitiesLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading universities...</p>
              )}
              {!universitiesLoading && universities.length === 0 && (
                <p className="mt-1 text-xs text-red-500">No universities available</p>
              )}
            </div>

            {/* Course Selection - Only show for Rookies */}
            {formData.role === 'ROOKIE' && (
              <div className="mt-6">
                <CourseSelection
                  selectedCourses={selectedCourses}
                  onCourseSelectionChange={setSelectedCourses}
                  maxCourses={5}
                />
              </div>
            )}

            {/* Course Selection - Only show for Tutors */}
            {formData.role === 'TUTO' && (
              <div className="mt-6">
                <TutorCourseSelection
                  selectedCourses={selectedCourses}
                  onCourseSelectionChange={setSelectedCourses}
                  selectedDepartments={selectedDepartments}
                  onDepartmentSelectionChange={setSelectedDepartments}
                  maxCourses={10}
                />
              </div>
            )}

                <div className="grid grid-cols-2 gap-3">
            {/* Password */}
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
                type="password"
                autoComplete="new-password"
                required
                        className={`w-full px-3 py-2 pl-8 pr-8 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm ${
                          isFocused.password 
                            ? 'border-blue-700/60 bg-white' 
                            : 'border-gray-200 bg-white/80 hover:border-gray-300'
                        }`}
                        placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                        onFocus={() => handleFocus('password')}
                        onBlur={() => handleBlur('password')}
              />
                                      <LockClosedIcon className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isFocused.password ? 'text-primary-500' : 'text-gray-400'
                }`} />
                    </div>
            </div>

            {/* Confirm Password */}
                  <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className={`relative transition-all duration-300 ${
                      isFocused.confirmPassword ? 'transform scale-105' : ''
                    }`}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                        className={`w-full px-3 py-2 pl-8 pr-8 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm ${
                          isFocused.confirmPassword 
                            ? 'border-blue-700/60 bg-white' 
                            : 'border-gray-200 bg-white/80 hover:border-gray-300'
                        }`}
                        placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                        onFocus={() => handleFocus('confirmPassword')}
                        onBlur={() => handleBlur('confirmPassword')}
              />
                                      <LockClosedIcon className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isFocused.confirmPassword ? 'text-primary-500' : 'text-gray-400'
                }`} />
                    </div>
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
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Create Account
                        <ArrowRightIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
            </button>
          </div>

                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-600">
              Already have an account?{' '}
                    <Link href="/auth/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Sign in
              </Link>
            </p>
                  <p className="text-xs text-gray-500">
                    <Link href="/" className="hover:text-primary-600 transition-colors">
                      ← Back to main
                    </Link>
                  </p>
                </div>
              </form>
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
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
} 