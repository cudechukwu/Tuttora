'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface OnboardingData {
  subjects: string[];
  learningStyle: string[];
  tutoringExperience: string;
  learningNeeds: string[];
  // Tuto-specific fields
  gpa: string;
  ratePerSession: string;
  teachingBio: string;
  availability: string[];
  certifications: string;
}

const subjects = [
  { id: 'computer-science', name: 'Computer Science' },
  { id: 'mathematics', name: 'Mathematics' },
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
  { id: 'economics', name: 'Economics' },
  { id: 'writing', name: 'Writing' },
  { id: 'film-studies', name: 'Film Studies' },
  { id: 'philosophy', name: 'Philosophy' },
  { id: 'history', name: 'History' },
  { id: 'psychology', name: 'Psychology' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'art', name: 'Art' },
  { id: 'music', name: 'Music' },
  { id: 'languages', name: 'Languages' }
];

const learningStyles = [
  { id: 'visual', name: 'Visual', description: 'I learn best through diagrams, charts, and visual aids' },
  { id: 'verbal', name: 'Verbal', description: 'I prefer explanations and discussions' },
  { id: 'example-driven', name: 'Example-driven', description: 'I learn best through real examples and case studies' },
  { id: 'practice-problems', name: 'Practice problems', description: 'I need hands-on practice to understand concepts' },
  { id: 'discussion-based', name: 'Discussion-based', description: 'I learn through conversation and debate' },
  { id: 'step-by-step', name: 'Step-by-step', description: 'I need concepts broken down into small, manageable steps' }
];

const learningNeeds = [
  { id: 'extra-time', name: 'I need extra time to process information' },
  { id: 'written-summaries', name: 'I benefit from written summaries' },
  { id: 'visual-aids', name: 'I need visual aids' },
  { id: 'adhd', name: 'I have ADHD/attention challenges' },
  { id: 'learning-disability', name: 'I have a diagnosed learning disability' },
  { id: 'discuss-later', name: 'I\'d prefer to discuss this 1:1 later' }
];

const availabilityOptions = [
  { id: 'mornings', name: 'Mornings' },
  { id: 'afternoons', name: 'Afternoons' },
  { id: 'evenings', name: 'Evenings' },
  { id: 'weekends', name: 'Weekends' }
];

export default function OnboardingStep2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'rookie';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState<OnboardingData>({
    subjects: [],
    learningStyle: [],
    tutoringExperience: '',
    learningNeeds: [],
    gpa: '',
    ratePerSession: 'Free (default)',
    teachingBio: '',
    availability: [],
    certifications: ''
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
        
        // Load existing onboarding data from step 1
        const onboardingData = localStorage.getItem('onboardingStep1');
        if (onboardingData) {
          const step1Data = JSON.parse(onboardingData);
          // Merge with current form data
          setFormData(prev => ({
            ...prev,
            ...step1Data
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const handleLearningStyleToggle = (styleId: string) => {
    setFormData(prev => ({
      ...prev,
      learningStyle: prev.learningStyle.includes(styleId)
        ? prev.learningStyle.filter(id => id !== styleId)
        : [...prev.learningStyle, styleId]
    }));
  };

  const handleLearningNeedToggle = (needId: string) => {
    setFormData(prev => ({
      ...prev,
      learningNeeds: prev.learningNeeds.includes(needId)
        ? prev.learningNeeds.filter(id => id !== needId)
        : [...prev.learningNeeds, needId]
    }));
  };

  const handleAvailabilityToggle = (availabilityId: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(availabilityId)
        ? prev.availability.filter(id => id !== availabilityId)
        : [...prev.availability, availabilityId]
    }));
  };

  const handleBack = () => {
    router.push('/onboarding?role=' + role);
  };

  const handleComplete = async () => {
    // Validate required fields based on role
    if (role === 'tuto') {
      if (formData.subjects.length === 0 || !formData.gpa || !formData.teachingBio) {
        return;
      }
    } else {
      if (formData.subjects.length === 0 || formData.learningStyle.length === 0) {
        return;
      }
    }

    setSaving(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      // Get step 1 data
      const step1Data = localStorage.getItem('onboardingStep1');
      const completeOnboardingData = step1Data ? { ...JSON.parse(step1Data), ...formData } : formData;
      
      // Save onboarding data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/profile/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          role: role,
          onboardingData: completeOnboardingData
        })
      });

      if (response.ok) {
        // Update user profile completion status
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/profile-completed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (userResponse.ok) {
          // Clear onboarding data from localStorage
          localStorage.removeItem('onboardingStep1');
          
          // Redirect to dashboard
          router.push(`/dashboard/${role}`);
        }
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/landing/section/dashboard.png)' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
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
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="text-xs">Back</span>
              </button>
              <div className="hidden md:flex items-center space-x-6">
                <span className="text-gray-700 font-medium tracking-tight text-xs">Complete Your Profile</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 font-normal tracking-tight text-xs">Step 2 of 2</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-gray-600">Step 2 of 2</div>
                <div className="text-xs text-gray-500">Learning Preferences</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xs md:text-sm lg:text-base font-medium text-gray-700 tracking-tight" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
            {role === 'tuto' ? 'Tuto Setup' : 'Tell us about your learning preferences!'}
          </h1>
          <p className="text-gray-600 italic text-xs" style={{ fontFamily: 'Garamond, Georgia, serif' }}>
            {role === 'tuto' 
              ? 'Tell us about your teaching expertise! 🎓'
              : 'This helps us match you with the perfect tutor'
            }
          </p>
        </div>

        <div className="space-y-8 sm:space-y-10">
            {role === 'tuto' ? (
              // Tuto-specific fields
              <>
                {/* GPA and Rate per Session */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GPA */}
                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-3">
                    GPA *
                  </label>
                    <input
                      type="text"
                      value={formData.gpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                      placeholder="e.g., 3.5"
                      style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                    />
                  </div>

                  {/* Rate per Session */}
                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rate per Session
                  </label>
                    <input
                      type="text"
                      value={formData.ratePerSession}
                      onChange={(e) => setFormData(prev => ({ ...prev, ratePerSession: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                      placeholder="e.g., $20/hour"
                      style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Subjects you can tutor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Subjects you can tutor *
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleSubjectToggle(subject.id)}
                        className={`p-1.5 rounded-lg border transition-all text-left ${
                          formData.subjects.includes(subject.id)
                            ? 'border-gray-500 bg-gray-50 text-gray-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="text-xs text-gray-700 font-medium text-left">{subject.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teaching Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Teaching Bio *
                  </label>
                  <textarea
                    value={formData.teachingBio}
                    onChange={(e) => setFormData(prev => ({ ...prev, teachingBio: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                    placeholder="Why do you want to tutor? What's your teaching approach?"
                    style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                  />
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Availability
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {availabilityOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleAvailabilityToggle(option.id)}
                        className={`p-1.5 rounded-lg border transition-all text-left ${
                          formData.availability.includes(option.id)
                            ? 'border-gray-500 bg-gray-50 text-gray-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="text-xs text-gray-700 font-medium text-left">{option.name}</span>
                      </button>
                    ))}
                  </div>
                </div>



                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Certifications or Achievements (Optional)
                  </label>
                  <textarea
                    value={formData.certifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                    placeholder="List any relevant certifications, awards, or achievements..."
                    style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                  />
                </div>
              </>
            ) : (
              // Rookie-specific fields
              <>
                {/* Subjects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Subjects you need help with *
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleSubjectToggle(subject.id)}
                        className={`p-1.5 rounded-lg border transition-all text-left ${
                          formData.subjects.includes(subject.id)
                            ? 'border-gray-500 bg-gray-50 text-gray-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="text-xs text-gray-700 font-medium text-left">{subject.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Learning Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Learning Style *
                  </label>
                  <div className="space-y-2">
                    {learningStyles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleLearningStyleToggle(style.id)}
                        className={`w-full p-2 rounded-lg border text-left transition-all ${
                          formData.learningStyle.includes(style.id)
                            ? 'border-gray-500 bg-gray-50 text-gray-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-xs text-gray-700 font-medium">{style.name}</div>
                        <div className="text-xs text-gray-600 mt-0.5 font-medium">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tutoring Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Prior tutoring experience (Optional)
                  </label>
                  <textarea
                    value={formData.tutoringExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, tutoringExperience: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                    placeholder="Tell us about your previous tutoring experiences..."
                    style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                  />
                </div>

                {/* Learning Needs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Learning Needs & Accommodations (Optional)
                  </label>
                  <p className="text-gray-600 mb-4 italic text-xs" style={{ fontFamily: 'Garamond, Georgia, serif' }}>
                    Do you have any learning needs, disabilities, or accommodations you'd like your tutor to be aware of, so they can better support you?
                  </p>
                  <div className="space-y-2">
                    {learningNeeds.map((need) => (
                      <label key={need.id} className="flex items-center space-x-3 p-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.learningNeeds.includes(need.id)}
                          onChange={() => handleLearningNeedToggle(need.id)}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-700 font-medium">{need.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-gray-800 transition-colors text-xs"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleComplete}
              disabled={
                saving || 
                (role === 'tuto' 
                  ? (formData.subjects.length === 0 || !formData.gpa || !formData.teachingBio)
                  : (formData.subjects.length === 0 || formData.learningStyle.length === 0)
                )
              }
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 text-white rounded-lg text-xs font-semibold transition-colors font-medium tracking-tight bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
            >
              <span>Complete Profile</span>
              {saving && <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
            </button>
          </div>
      </main>
    </div>
  );
} 