'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Building, Check, X } from 'lucide-react';

interface MajorSelectionProps {
  selectedMajors: string[];
  onMajorSelectionChange: (majors: string[]) => void;
  maxMajors?: number;
}

export default function MajorSelection({ 
  selectedMajors, 
  onMajorSelectionChange, 
  maxMajors = 3 
}: MajorSelectionProps) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  
  const departmentSearchRef = useRef<HTMLDivElement>(null);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Click outside handler for department search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (departmentSearchRef.current && !departmentSearchRef.current.contains(event.target as Node)) {
        setShowDepartmentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/courses/departments`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMajorToggle = (major: string) => {
    const isSelected = selectedMajors.includes(major);
    
    if (isSelected) {
      // Remove major
      const updatedMajors = selectedMajors.filter(m => m !== major);
      onMajorSelectionChange(updatedMajors);
    } else {
      // Add major (if under limit)
      if (selectedMajors.length < maxMajors) {
        const updatedMajors = [...selectedMajors, major];
        onMajorSelectionChange(updatedMajors);
      }
    }
  };

  const removeMajor = (major: string) => {
    const updatedMajors = selectedMajors.filter(m => m !== major);
    onMajorSelectionChange(updatedMajors);
  };

  const filteredDepartments = (departments || []).filter(dept =>
    dept.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Selected Majors Display */}
      {selectedMajors.length > 0 && (
        <div className="backdrop-blur-sm bg-white/50 border border-white/30 rounded-lg p-2">
          <h3 className="text-xs font-semibold text-gray-700 mb-1">
            Selected Majors ({selectedMajors.length}/{maxMajors})
          </h3>
          <div className="flex flex-wrap gap-1">
            {selectedMajors.map((major) => (
              <div key={major} className="flex items-center backdrop-blur-sm bg-white/70 rounded-md px-2 py-0.5 border border-white/40">
                <div className="flex items-center space-x-1">
                  <Building className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-700 italic">
                    {major}
                  </span>
                </div>
                <button
                  onClick={() => removeMajor(major)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-0.5 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Major Selection Section */}
      <div className="backdrop-blur-sm bg-white/50 border border-white/30 rounded-lg p-2">

        <div ref={departmentSearchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="e.g., MATH, CS, ENGL, BIOL..."
              value={departmentSearchTerm}
              onChange={(e) => setDepartmentSearchTerm(e.target.value)}
              onFocus={() => setShowDepartmentDropdown(true)}
              className="w-full pl-10 pr-3 py-1.5 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
              style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
            />
            
            {/* Department Results Dropdown */}
            {showDepartmentDropdown && (
              <div className="absolute z-10 w-full mt-1 backdrop-blur-sm bg-white/90 border border-white/30 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2">Loading departments...</p>
                  </div>
                ) : filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department) => {
                    const isSelected = selectedMajors.includes(department);
                    const isDisabled = !isSelected && selectedMajors.length >= maxMajors;
                    
                    return (
                      <div
                        key={department}
                        onClick={() => {
                          if (!isDisabled) {
                            handleMajorToggle(department);
                          }
                        }}
                        className={`px-3 py-2 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900'
                            : isDisabled
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {isSelected && (
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium">
                                {department}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      {departmentSearchTerm ? 'No departments found matching your search.' : 'Start typing to search for departments.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 