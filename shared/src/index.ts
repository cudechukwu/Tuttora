// User Types
export interface User {
  id: string;
  email: string;
  username: string; // Anonymous username like "u-echo-quill-146"
  firstName: string;
  lastName: string;
  universityId: string;
  role: UserRole;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  TUTO = 'tuto',
  ROOKIE = 'rookie',
  BOTH = 'both'
}

// University Types
export interface University {
  id: string;
  name: string;
  domain: string; // For email validation
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

// Course Types
export interface Course {
  id: string;
  code: string; // e.g., "CS101"
  name: string;
  description: string;
  universityId: string;
  department: string;
  level: CourseLevel;
  createdAt: Date;
  updatedAt: Date;
}

export enum CourseLevel {
  UNDERGRADUATE = 'undergraduate',
  GRADUATE = 'graduate',
  PHD = 'phd'
}

// User-Course Relationship (for Tutos)
export interface UserCourse {
  id: string;
  userId: string;
  courseId: string;
  expertiseLevel: ExpertiseLevel;
  proficiencyLevel?: ProficiencyLevel;
  semesterTaken?: Semester;
  yearCompleted?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ExpertiseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum ProficiencyLevel {
  CURRENTLY_TAKING = 'CURRENTLY_TAKING',
  TOOK_COURSE = 'TOOK_COURSE',
  GOT_A = 'GOT_A',
  TUTORED_BEFORE = 'TUTORED_BEFORE',
  TAED = 'TAED'
}

export enum Semester {
  FALL = 'FALL',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  WINTER = 'WINTER'
}

// Session Types
export interface Session {
  id: string;
  tutoId: string;
  rookieId: string;
  courseId?: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum SessionStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  universityId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  universityId: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 