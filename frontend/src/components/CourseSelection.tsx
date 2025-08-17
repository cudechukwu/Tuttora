'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, ChevronDown, ChevronUp, Check, Building, Trash2 } from 'lucide-react';

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

interface CourseSelectionProps {
  selectedCourses: Course[];
  onCourseSelectionChange: (courses: Course[]) => void;
  maxCourses?: number;
}

export default function CourseSelection({ 
  selectedCourses, 
  onCourseSelectionChange, 
  maxCourses = 5 
}: CourseSelectionProps) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDepartmentSearch, setShowDepartmentSearch] = useState(true);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  
  const departmentSearchRef = useRef<HTMLDivElement>(null);
  const courseSearchRef = useRef<HTMLDivElement>(null);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch courses when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchCoursesByDepartment(selectedDepartment);
    }
  }, [selectedDepartment]);

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

  // Click outside handler for course search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseSearchRef.current && !courseSearchRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
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

  const fetchCoursesByDepartment = async (department: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/courses/department/${encodeURIComponent(department)}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseToggle = (course: Course) => {
    const isSelected = selectedCourses.some(c => c.id === course.id);
    
    if (isSelected) {
      // Remove course
      const updatedCourses = selectedCourses.filter(c => c.id !== course.id);
      onCourseSelectionChange(updatedCourses);
    } else {
      // Add course (if under limit)
      if (selectedCourses.length < maxCourses) {
        const updatedCourses = [...selectedCourses, course];
        onCourseSelectionChange(updatedCourses);
      }
    }
  };

  const removeCourse = (courseId: string) => {
    const updatedCourses = selectedCourses.filter(c => c.id !== courseId);
    onCourseSelectionChange(updatedCourses);
  };

  const selectDepartment = (department: string) => {
    setSelectedDepartment(department);
    setShowDepartmentSearch(false);
    setDepartmentSearchTerm('');
  };

  const backToDepartmentSearch = () => {
    setSelectedDepartment('');
    setShowDepartmentSearch(true);
    setCourseSearchTerm('');
    setCourses([]);
  };

  const filteredDepartments = (departments || []).filter(dept =>
    dept.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );

  const filteredCourses = (courses || []).filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Selected Courses Display */}
      {selectedCourses.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-green-800 mb-3">
            Selected Courses ({selectedCourses.length}/{maxCourses})
          </h3>
          <div className="space-y-2">
            {selectedCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between bg-white rounded-lg p-1.5 border border-green-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-700 italic">
                      {course.code} - {course.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {course.department} • {course.credits} credit{course.credits !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => removeCourse(course.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Selection Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-gray-900 mb-4">
          Select Your Courses
        </h3>

        {showDepartmentSearch ? (
          /* Department Search */
          <div className="space-y-4">
            <div ref={departmentSearchRef} className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Search for Department
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., MATH, CS, ENGL..."
                  value={departmentSearchTerm}
                  onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                  onFocus={() => setShowDepartmentDropdown(true)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-blue-700/60"
                />
                
                {/* Department Results Dropdown */}
                {showDepartmentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-xs text-gray-500 mt-2">Loading departments...</p>
                      </div>
                    ) : filteredDepartments.length > 0 ? (
                      filteredDepartments.map((department) => (
                        <div
                          key={department}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3"
                          onClick={() => {
                            selectDepartment(department);
                            setShowDepartmentDropdown(false);
                          }}
                        >
                          <Building className="w-4 h-4 text-blue-700/70 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900">{department}</span>
                        </div>
                      ))
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
        ) : (
          /* Course Search within Selected Department */
          <div className="space-y-4">
            {/* Department Header */}
            <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-700/70" />
                <span className="text-sm font-medium text-primary-900">{selectedDepartment}</span>
              </div>
              <button
                onClick={backToDepartmentSearch}
                className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
              >
                Change Department
              </button>
            </div>

            {/* Course Search */}
            <div ref={courseSearchRef} className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Search for Courses in {selectedDepartment}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by title or code..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  onFocus={() => setShowCourseDropdown(true)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-blue-700/60"
                />
                
                {/* Course Results Dropdown */}
                {showCourseDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-xs text-gray-500 mt-2">Loading courses...</p>
                      </div>
                    ) : filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => {
                        const isSelected = selectedCourses.some(c => c.id === course.id);
                        const isDisabled = !isSelected && selectedCourses.length >= maxCourses;
                        
                        return (
                          <div
                            key={course.id}
                            onClick={() => {
                              if (!isDisabled) {
                                handleCourseToggle(course);
                              }
                            }}
                            className={`px-3 py-2 cursor-pointer ${
                              isSelected
                                ? 'bg-green-50 text-green-900'
                                : isDisabled
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {course.code} - {course.title}
                                  </span>
                                </div>
                                <p className="text-xs mt-1 text-gray-600">
                                  {course.credits} credit{course.credits !== 1 ? 's' : ''} • {course.professor}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          {courseSearchTerm ? 'No courses found matching your search.' : 'No courses available in this department.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="font-medium text-blue-800 mb-1">Course Selection Tips:</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Search for your department first, then search for specific courses</li>
            <li>• Select up to {maxCourses} courses you're currently taking</li>
            <li>• This helps tutors understand what subjects you need help with</li>
            <li>• You can update your course selection anytime in your profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 