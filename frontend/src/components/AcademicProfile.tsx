'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Award, GraduationCap, BookOpen, Plus, X } from 'lucide-react';

interface AcademicProfileData {
  academicStanding: string;
  expectedGraduationDate: string;
  academicAwards: string[];
  researchExperience: string;
}

interface AcademicProfileProps {
  userRole: 'tuto' | 'rookie';
  initialData?: AcademicProfileData;
  onSave: (data: AcademicProfileData) => void;
  onCancel: () => void;
}

const academicStandings = ['Dean\'s List', 'Honors', 'Regular', 'Probation'];

export default function AcademicProfile({ userRole, initialData, onSave, onCancel }: AcademicProfileProps) {
  const [formData, setFormData] = useState<AcademicProfileData>({
    academicStanding: '',
    expectedGraduationDate: '',
    academicAwards: [],
    researchExperience: ''
  });

  const [newAward, setNewAward] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof AcademicProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddAward = () => {
    if (newAward.trim()) {
      setFormData(prev => ({
        ...prev,
        academicAwards: [...prev.academicAwards, newAward.trim()]
      }));
      setNewAward('');
    }
  };

  const handleRemoveAward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      academicAwards: prev.academicAwards.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.academicStanding) {
      newErrors.academicStanding = 'Academic standing is required';
    }

    if (!formData.expectedGraduationDate) {
      newErrors.expectedGraduationDate = 'Expected graduation date is required';
    } else {
      const graduationDate = new Date(formData.expectedGraduationDate);
      const now = new Date();
      const tenYearsFromNow = new Date();
      tenYearsFromNow.setFullYear(now.getFullYear() + 10);

      if (graduationDate < now) {
        newErrors.expectedGraduationDate = 'Graduation date must be in the future';
      } else if (graduationDate > tenYearsFromNow) {
        newErrors.expectedGraduationDate = 'Graduation date cannot be more than 10 years in the future';
      }
    }

    // Only require research experience for Honors or Dean's List
    if ((formData.academicStanding === 'Honors' || formData.academicStanding === 'Dean\'s List') && !formData.researchExperience.trim()) {
      newErrors.researchExperience = 'Research experience is required for Honors/Dean\'s List students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving academic profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-xl font-medium text-gray-700 tracking-tight mb-2">Academic Information</h2>
        <p className="text-base md:text-sm font-medium text-gray-500 tracking-tight italic font-serif">Tell us about your academic achievements! 🎓</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Standing */}
        <div>
          <label className="block text-xs text-gray-900 mb-0.5 font-medium tracking-tight">
            Academic Standing *
          </label>
          <select
            value={formData.academicStanding}
            onChange={(e) => handleInputChange('academicStanding', e.target.value)}
            className={`w-full px-4 py-3 border border-white/30 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm font-medium tracking-tight backdrop-blur-sm bg-white/50 hover:bg-white/70 ${
              errors.academicStanding 
                ? 'border-red-300 bg-red-500/10' 
                : ''
            }`}
          >
            <option value="">Select academic standing</option>
            {academicStandings.map(standing => (
              <option key={standing} value={standing}>{standing}</option>
            ))}
          </select>
          {errors.academicStanding && (
            <p className="mt-1 text-[10px] text-red-600 font-medium tracking-tight">{errors.academicStanding}</p>
          )}
        </div>

        {/* Expected Graduation Date */}
        <div>
          <label className="block text-xs text-gray-900 mb-0.5 font-medium tracking-tight">
            Expected Graduation Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="month"
              value={formData.expectedGraduationDate}
              onChange={(e) => handleInputChange('expectedGraduationDate', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border border-white/30 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm font-medium tracking-tight backdrop-blur-sm bg-white/50 hover:bg-white/70 ${
                errors.expectedGraduationDate 
                  ? 'border-red-300 bg-red-500/10' 
                  : ''
              }`}
            />
          </div>
          {errors.expectedGraduationDate && (
            <p className="mt-1 text-[10px] text-red-600 font-medium tracking-tight">{errors.expectedGraduationDate}</p>
          )}
        </div>
      </div>

      {/* Academic Awards */}
      <div>
        <label className="block text-xs text-gray-900 mb-0.5 font-medium tracking-tight">
          Academic Awards & Honors
        </label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newAward}
              onChange={(e) => setNewAward(e.target.value)}
              placeholder="e.g., National Merit Scholar, Best Thesis Award"
              className="flex-1 px-4 py-3 border border-white/30 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm font-medium tracking-tight backdrop-blur-sm bg-white/50 hover:bg-white/70"
            />
            <button
              type="button"
              onClick={handleAddAward}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium tracking-tight"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {formData.academicAwards.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.academicAwards.map((award, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium tracking-tight"
                >
                  <Award className="w-4 h-4 text-gray-600" />
                  <span>{award}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAward(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Research Experience - Conditional */}
      {(formData.academicStanding === 'Honors' || formData.academicStanding === 'Dean\'s List') && (
        <div>
          <label className="block text-xs text-gray-900 mb-0.5 font-medium tracking-tight">
            Research Experience *
          </label>
          <textarea
            value={formData.researchExperience}
            onChange={(e) => handleInputChange('researchExperience', e.target.value)}
            rows={4}
            placeholder="Describe your research experience, projects, or academic work..."
            className={`w-full px-4 py-3 border border-white/30 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm font-medium tracking-tight resize-none backdrop-blur-sm bg-white/50 hover:bg-white/70 ${
              errors.researchExperience 
                ? 'border-red-300 bg-red-500/10' 
                : ''
            }`}
          />
          {errors.researchExperience && (
            <p className="mt-1 text-[10px] text-red-600 font-medium tracking-tight">{errors.researchExperience}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold font-medium tracking-tight"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`flex items-center px-8 py-3 text-white rounded-lg text-xs font-semibold transition-colors font-medium tracking-tight disabled:opacity-50 disabled:cursor-not-allowed bg-gray-600 hover:bg-gray-700`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              Save Academic Info
              <GraduationCap className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
} 