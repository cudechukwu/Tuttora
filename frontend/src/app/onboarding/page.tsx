'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import MajorSelection from '@/components/MajorSelection';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  university?: {
    name: string;
  };
}

interface OnboardingData {
  preferredName: string;
  pronouns: string;
  yearOfStudy: string;
  selectedMajors: string[];
  avatar: string;
}



const avatars = [
  '/images/avatars/white-glasses.jpg',
  '/images/avatars/black-curly.jpg',
  '/images/avatars/schoolboy.png',
  '/images/avatars/brunette.png',
  '/images/avatars/whitegirl.jpg',
  '/images/avatars/asian.jpg',
  '/images/avatars/fade.png',
  '/images/avatars/latin-woman.jpg',
  '/images/avatars/smilygirl.png',
  '/images/avatars/jasmine.png',
  '/images/avatars/afro.png',
  '/images/avatars/black-afro.png',
  '/images/avatars/chillguy.png',
  '/images/avatars/punk.png',
  '/images/avatars/black-beard.jpg',
  '/images/avatars/white-beard.jpg',
  '/images/avatars/brownhair.png',
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'rookie';
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingData>({
    preferredName: '',
    pronouns: '',
    yearOfStudy: '',
    selectedMajors: [],
    avatar: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        
        if (!userData || !accessToken) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Pre-fill with user data
        setFormData(prev => ({
          ...prev,
          preferredName: `${parsedUser.firstName} ${parsedUser.lastName}`,
          pronouns: 'He/Him' // Default, can be changed
        }));
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleInputChange = (field: keyof OnboardingData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };





  const handleNext = () => {
    // Validate step 1
    if (!formData.preferredName || !formData.yearOfStudy || formData.selectedMajors.length === 0 || !formData.avatar) {
      return;
    }
    
    // Save step 1 data to localStorage
    localStorage.setItem('onboardingStep1', JSON.stringify({
      preferredName: formData.preferredName,
      pronouns: formData.pronouns,
      yearOfStudy: formData.yearOfStudy,
      selectedMajors: formData.selectedMajors,
      avatar: formData.avatar
    }));
    
    // Navigate to step 2
    router.push(`/onboarding/step2?role=${role}`);
  };





  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
      {/* Navigation Header */}
      <nav className="bg-cover bg-center border-b border-gray-200 sticky top-0 z-50" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)', height: '3.25rem' }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-13 min-h-[3.25rem]">
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-6">
                <span className="text-gray-700 font-medium tracking-tight text-xs">Complete Your Profile</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 font-normal tracking-tight text-xs">Step 1 of 2</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-gray-600">Step 1 of 2</div>
                <div className="text-xs text-gray-500">Basic Info</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xs md:text-sm lg:text-base font-medium text-gray-700 tracking-tight" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>Complete Your Profile</h1>
          <p className="text-gray-600 italic text-xs" style={{ fontFamily: 'Garamond, Georgia, serif' }}>Let&apos;s get to know you better! 🎓</p>
        </div>

        {/* Top Section - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Preferred Name */}
              <div>
                <label className="block text-xs text-gray-700 font-medium mb-3">
                  Preferred Name/Nickname *
                </label>
                <input
                  type="text"
                  value={formData.preferredName}
                  onChange={(e) => handleInputChange('preferredName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                  placeholder="Enter your preferred name"
                  style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                />
              </div>

              {/* Pronouns */}
              <div>
                <label className="block text-xs text-gray-700 font-medium mb-3">
                  Pronouns
                </label>
                <select
                  value={formData.pronouns}
                  onChange={(e) => handleInputChange('pronouns', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                  style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                >
                  <option value="">Select pronouns</option>
                  <option value="He/Him">He/Him</option>
                  <option value="She/Her">She/Her</option>
                  <option value="They/Them">They/Them</option>
                  <option value="He/They">He/They</option>
                  <option value="She/They">She/They</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Year of Study */}
              <div>
                <label className="block text-xs text-gray-700 font-medium mb-3">
                  Year of Study *
                </label>
                <select
                  value={formData.yearOfStudy}
                  onChange={(e) => handleInputChange('yearOfStudy', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                  style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                >
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              {/* Majors */}
              <div>
                <label className="block text-xs text-gray-700 font-medium mb-3">
                  Major(s) *
                </label>
                <MajorSelection
                  selectedMajors={formData.selectedMajors}
                  onMajorSelectionChange={(majors) => handleInputChange('selectedMajors', majors)}
                  maxMajors={3}
                />
              </div>
            </div>
          </div>

                  {/* Bottom Section - Single Column Layout */}
          <div className="space-y-8">

          {/* Avatar Selection */}
          <div>
                          <label className="block text-xs text-gray-700 font-medium mb-4">
                Choose an Avatar *
              </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {avatars.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleInputChange('avatar', avatar)}
                                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 transition-all overflow-hidden ${
                      formData.avatar === avatar
                        ? 'border-gray-500 ring-2 ring-gray-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <Image
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-full"
                    style={{ objectFit: 'cover' }}
                    priority={index < 6} // Prioritize first 6 avatars
                    onError={(e) => {
                      // Fallback to a default avatar if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/avatars/afro.png';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
                          className="flex items-center space-x-2 px-6 py-3 text-white rounded-lg text-xs font-semibold transition-colors font-medium tracking-tight bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
          >
            <span>Next</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}