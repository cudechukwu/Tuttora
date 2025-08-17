'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BellIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  CalendarIcon,
  BookOpenIcon,
  StarIcon,
  TrophyIcon,
  PencilIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import AcademicProfile from '@/components/AcademicProfile';
import CourseManagement from '@/components/CourseManagement';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileCompleted: boolean;
  university?: {
    name: string;
  };
}

interface Course {
  id: string;
  courseId: string;
  proficiencyLevel: string;
  semesterTaken?: string;
  yearCompleted?: number;
  isActive: boolean;
  course: {
    id: string;
    code: string;
    title: string;
    department: string;
    credits?: number;
  };
  grade?: string;
  professor?: string;
  courseNotes?: string;
  difficultyRating?: number;
  timeSpent?: number;
  wouldRecommend?: boolean;
  courseReview?: string;
}

interface AcademicData {
  academicStanding?: string;
  expectedGraduationDate?: string;
  academicAwards: string[];
  researchExperience?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicData, setAcademicData] = useState<AcademicData>({
    academicAwards: []
  });
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingAcademic, setEditingAcademic] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userData = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        
        if (!userData || !accessToken) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Load academic profile data
        const academicResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/profile`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (academicResponse.ok) {
          const academicData = await academicResponse.json();
          setCourses(academicData.data.courses || []);
          setAcademicData({
            academicStanding: academicData.data.academicStanding,
            expectedGraduationDate: academicData.data.expectedGraduationDate,
            academicAwards: academicData.data.academicAwards || [],
            researchExperience: academicData.data.researchExperience
          });
        }

        // Calculate profile completion
        calculateProfileCompletion();
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // Match right column height to left column
  useEffect(() => {
    const matchHeights = () => {
      const leftColumn = document.getElementById('left-column');
      const rightColumn = document.getElementById('right-column');
      
      if (leftColumn && rightColumn && window.innerWidth >= 1024) { // lg breakpoint
        const leftHeight = leftColumn.offsetHeight;
        rightColumn.style.height = `${leftHeight}px`;
      }
    };

    // Initial match
    matchHeights();
    
    // Match on window resize
    window.addEventListener('resize', matchHeights);
    
    // Match when content changes
    const observer = new MutationObserver(matchHeights);
    if (document.getElementById('left-column')) {
      observer.observe(document.getElementById('left-column')!, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', matchHeights);
      observer.disconnect();
    };
  }, [user, academicData, courses]);

  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 0;

    // Basic info
    total += 4; // name, email, role, university
    if (user?.firstName) completed += 1;
    if (user?.email) completed += 1;
    if (user?.role) completed += 1;
    if (user?.university?.name) completed += 1;

    // Academic info
    total += 4; // standing, graduation, awards, research
    if (academicData.academicStanding) completed += 1;
    if (academicData.expectedGraduationDate) completed += 1;
    if (academicData.academicAwards.length > 0) completed += 1;
    if (academicData.researchExperience) completed += 1;

    // Courses
    total += 2; // at least one course, course details
    if (courses.length > 0) completed += 1;
    if (courses.some(c => c.grade || c.difficultyRating)) completed += 1;

    setProfileCompletion(Math.round((completed / total) * 100));
  };



  const handleAcademicUpdate = async (updates: Partial<AcademicData>) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          role: user?.role.toLowerCase(),
          academicData: updates
        })
      });

      if (response.ok) {
        setAcademicData(prev => ({ ...prev, ...updates }));
        setEditingAcademic(false);
        calculateProfileCompletion();
      }
    } catch (error) {
      console.error('Error updating academic profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

        return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
      {/* Navigation Header */}
      <nav className="bg-cover bg-center border-b border-gray-200 sticky top-0 z-50" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)', height: '3.25rem' }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-13 min-h-[3.25rem]">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                  <Image
                    src="/images/logo/TP_Logo.png"
                    alt="Tuttora Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <span className="text-gray-700 font-medium tracking-tight">Profile</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 font-normal tracking-tight text-xs md:text-sm">{user.role} </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative">
                <button
                  onClick={() => router.push(`/dashboard/${user.role.toLowerCase()}`)}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full focus:outline-none"
                  aria-label="Go to dashboard"
                >
                  <HomeIcon className="w-5 h-5" />
                </button>
              </div>
              {/* Add logout icon */}
              <button
                className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-full focus:outline-none"
                aria-label="Log out"
                onClick={() => {
                  localStorage.removeItem('user');
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  window.location.href = '/auth/login';
                }}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Account Details */}
          <div className="lg:w-1/3 space-y-6" id="left-column">
            {/* User Info Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-400" />
                </div>
              <div>
                  <h2 className="text-base font-normal text-gray-700 tracking-tight">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-xs text-gray-500 capitalize font-normal tracking-tight">{user.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">{user.university?.name || 'University not set'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpenIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 capitalize">{user.role}</span>
                </div>
              </div>
              </div>

            {/* Academic Info Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-normal text-gray-700 tracking-tight">Academic Info</h3>
                <button
                  onClick={() => setEditingAcademic(!editingAcademic)}
                  className="text-gray-400 hover:text-pink-600 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>

                             {editingAcademic ? (
                 <AcademicProfile
                   userRole={user.role.toLowerCase() as 'tuto' | 'rookie'}
                   initialData={{
                     academicStanding: academicData.academicStanding || '',
                     expectedGraduationDate: academicData.expectedGraduationDate || '',
                     academicAwards: academicData.academicAwards,
                     researchExperience: academicData.researchExperience || ''
                   }}
                   onSave={(data) => handleAcademicUpdate(data)}
                   onCancel={() => setEditingAcademic(false)}
                 />
               ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <TrophyIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {academicData.academicStanding || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {academicData.expectedGraduationDate || 'Not set'}
                    </span>
                  </div>
                  {academicData.academicAwards.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <StarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="text-xs text-gray-600">
                        <div className="font-medium mb-1">Awards:</div>
                        <div className="space-y-1">
                          {academicData.academicAwards.map((award, index) => (
                            <div key={index} className="bg-gray-50 px-2 py-1 rounded text-xs">
                              {award}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
              )}
            </div>

            {/* Profile Completion Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <h3 className="text-base font-normal text-gray-700 tracking-tight mb-4">Profile Completion</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray={`${profileCompletion}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-normal text-gray-700 tracking-tight">{profileCompletion}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-normal tracking-tight">
                    {profileCompletion < 50 ? 'Keep going!' : 
                     profileCompletion < 80 ? 'Almost there!' : 'Great job!'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-normal tracking-tight">
                    Complete your profile to get better matches
                  </p>
                </div>
                  </div>
                  </div>
                </div>
                
          {/* Right Column - Course Progress */}
          <div className="lg:w-2/3 flex flex-col" id="right-column">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 h-full overflow-hidden" style={{ maxHeight: '600px' }}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-normal text-gray-900">Course Progress</h3>
            </div>

                <div className="space-y-4 flex-1 overflow-y-auto" style={{ maxHeight: '500px' }}>
                  <CourseManagement 
                    userCourses={courses}
                    onCourseUpdate={(courseId, data) => {
                      // Update the course in the local state
                      setCourses(prev => prev.map(course => 
                        course.courseId === courseId ? { ...course, ...data } : course
                      ));
                    }}
                    onCourseDelete={(courseId) => {
                      // Remove the course from local state
                      setCourses(prev => prev.filter(course => course.courseId !== courseId));
                    }}
                    onCourseAdd={(data) => {
                      // Add the new course to local state
                      setCourses(prev => [...prev, data]);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
            </div>
  );
}

 