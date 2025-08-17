'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  code: string;
  department: string;
  credits?: number;
}

interface UserCourse {
  id: string;
  courseId: string;
  proficiencyLevel: string;
  semesterTaken?: string;
  yearCompleted?: number;
  isActive: boolean;
  course: Course;
  grade?: string;
  professor?: string;
  courseNotes?: string;
  difficultyRating?: number;
  timeSpent?: number;
  wouldRecommend?: boolean;
}

interface ProficiencyLevel {
  value: string;
  label: string;
  score: number;
}

interface Semester {
  value: string;
  label: string;
}

interface Year {
  value: string;
  label: string;
}

interface CourseManagementProps {
  userCourses: UserCourse[];
  onCourseUpdate: (courseId: string, data: any) => void;
  onCourseDelete: (courseId: string) => void;
  onCourseAdd: (data: any) => void;
}

const CourseManagement: React.FC<CourseManagementProps> = ({
  userCourses,
  onCourseUpdate,
  onCourseDelete,
  onCourseAdd
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<UserCourse | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [proficiencyLevels, setProficiencyLevels] = useState<ProficiencyLevel[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    proficiencyLevel: '',
    semesterTaken: '',
    yearCompleted: '',
    isActive: true
  });

  useEffect(() => {
    fetchValidationData();
  }, []);

  const fetchValidationData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [proficiencyRes, semestersRes, yearsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/courses/proficiency-levels`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/courses/semesters`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/courses/years`, { headers })
      ]);

      if (proficiencyRes.ok) {
        const data = await proficiencyRes.json();
        setProficiencyLevels(data.data);
      }

      if (semestersRes.ok) {
        const data = await semestersRes.json();
        setSemesters(data.data);
      }

      if (yearsRes.ok) {
        const data = await yearsRes.json();
        setYears(data.data);
      }
    } catch (error) {
      console.error('Error fetching validation data:', error);
    }
  };

  const searchCourses = async (search: string) => {
    if (search.length < 2) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/courses/available?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableCourses(data.data);
      }
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setFormData({
      courseId: '',
      proficiencyLevel: '',
      semesterTaken: '',
      yearCompleted: '',
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  const handleEditCourse = (course: UserCourse) => {
    setSelectedCourse(course);
    setFormData({
      courseId: course.courseId,
      proficiencyLevel: course.proficiencyLevel,
      semesterTaken: course.semesterTaken || '',
      yearCompleted: course.yearCompleted?.toString() || '',
      isActive: course.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to remove this course from your profile?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (response.ok) {
          onCourseDelete(courseId);
        } else {
          console.error('Failed to delete course');
        }
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', { isEditModalOpen, formData, selectedCourse });
    
    try {
      const url = isEditModalOpen 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/courses/${selectedCourse?.courseId}/proficiency`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/academic/courses`;
      
      const method = isEditModalOpen ? 'PUT' : 'POST';
      
      console.log('Making request to:', url, 'with method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...formData,
          yearCompleted: formData.yearCompleted ? parseInt(formData.yearCompleted) : null
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success! Data:', data);
        if (isEditModalOpen) {
          onCourseUpdate(selectedCourse!.courseId, data.data);
        } else {
          onCourseAdd(data.data);
        }
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedCourse(null);
      } else if (response.status === 403) {
        // Token expired, try to refresh
        console.log('Token expired, attempting refresh...');
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refreshToken: refreshToken
              }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              // Update tokens in localStorage
              localStorage.setItem('accessToken', refreshData.tokens.accessToken);
              localStorage.setItem('refreshToken', refreshData.tokens.refreshToken);
              localStorage.setItem('user', JSON.stringify(refreshData.user));
              
              console.log('Token refreshed, retrying request...');
              
              // Retry the original request with new token
              const retryResponse = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${refreshData.tokens.accessToken}`
                },
                body: JSON.stringify({
                  ...formData,
                  yearCompleted: formData.yearCompleted ? parseInt(formData.yearCompleted) : null
                })
              });

              if (retryResponse.ok) {
                const data = await retryResponse.json();
                console.log('Success after token refresh! Data:', data);
                if (isEditModalOpen) {
                  onCourseUpdate(selectedCourse!.courseId, data.data);
                } else {
                  onCourseAdd(data.data);
                }
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedCourse(null);
              } else {
                const errorText = await retryResponse.text();
                console.error('Failed to save course after token refresh:', retryResponse.status, errorText);
              }
            } else {
              // Refresh failed, redirect to login
              console.error('Token refresh failed, redirecting to login');
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/auth/login';
            }
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/auth/login';
          }
        } else {
          // No refresh token, redirect to login
          console.error('No refresh token available, redirecting to login');
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to save course:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const getProficiencyLabel = (level: string) => {
    const proficiency = proficiencyLevels.find(p => p.value === level);
    return proficiency?.label || level;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-normal text-gray-900">Course Management</h3>
        <button
          onClick={handleAddCourse}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Course List */}
      <div className="space-y-3">
        {userCourses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No courses added yet</p>
            <p className="text-xs">Add your first course to get started</p>
          </div>
        ) : (
          userCourses.map((course) => (
            <div key={course.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-sm font-normal text-gray-900">{course.course.title}</h4>
                  <p className="text-xs text-gray-600">{course.course.code} • {course.course.department}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {getProficiencyLabel(course.proficiencyLevel)}
                    </span>
                    {course.semesterTaken && (
                      <span>{course.semesterTaken} {course.yearCompleted}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.courseId)}
                    className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Course Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-normal text-gray-900 mb-4">
              {isEditModalOpen ? 'Edit Course' : 'Add Course'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Course Selection - Only show search for new courses */}
              {!isEditModalOpen && (
                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1">
                    Course
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for a course..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchCourses(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-white/30 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                    />
                    <MagnifyingGlassIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Course Search Results */}
                  {searchTerm.length >= 2 && (
                    <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                      {loading ? (
                        <div className="p-2 text-xs text-gray-500">Searching...</div>
                      ) : (
                        availableCourses.map((course) => (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, courseId: course.id }));
                              setSearchTerm(`${course.code} - ${course.title}`);
                            }}
                            className="w-full text-left p-2 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{course.code}</div>
                            <div className="text-gray-600">{course.title}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Course Display - Show course name as read-only when editing */}
              {isEditModalOpen && selectedCourse && (
                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1">
                    Course
                  </label>
                  <div className="px-3 py-2 backdrop-blur-sm bg-white/50 border border-white/30 rounded-lg text-xs text-gray-700">
                    {selectedCourse.course.code} - {selectedCourse.course.title}
                  </div>
                </div>
              )}

              {/* Proficiency Level */}
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  Proficiency Level *
                </label>
                <select
                  value={formData.proficiencyLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, proficiencyLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-white/30 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                  required
                >
                  <option value="">Select proficiency level</option>
                  {proficiencyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semesterTaken}
                  onChange={(e) => setFormData(prev => ({ ...prev, semesterTaken: e.target.value }))}
                  className="w-full px-3 py-2 border border-white/30 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                >
                  <option value="">Select semester</option>
                  {semesters.map((semester) => (
                    <option key={semester.value} value={semester.value}>
                      {semester.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={formData.yearCompleted}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearCompleted: e.target.value }))}
                  className="w-full px-3 py-2 border border-white/30 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all"
                >
                  <option value="">Select year</option>
                  {years.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedCourse(null);
                    setSearchTerm('');
                  }}
                  className="flex-1 px-4 py-2 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isEditModalOpen ? 'Update' : 'Add'} Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement; 