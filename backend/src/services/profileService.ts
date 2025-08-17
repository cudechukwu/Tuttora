import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
  errors: string[];
}

export class ProfileService {
  /**
   * Validates if a user's profile is complete based on their role(s)
   */
  static async validateProfileCompletion(userId: string): Promise<ProfileValidationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          tutoProfile: true,
          rookieProfile: true
        }
      });

      if (!user) {
        return {
          isComplete: false,
          missingFields: [],
          errors: ['User not found']
        };
      }

      const missingFields: string[] = [];
      const errors: string[] = [];

      // Check based on user role
      if (user.role === 'TUTO' || user.role === 'BOTH') {
        const tutoValidation = this.validateTutoProfile(user.tutoProfile);
        missingFields.push(...tutoValidation.missingFields.map(field => `Tuto: ${field}`));
        errors.push(...tutoValidation.errors);
      }

      if (user.role === 'ROOKIE' || user.role === 'BOTH') {
        const rookieValidation = this.validateRookieProfile(user.rookieProfile);
        missingFields.push(...rookieValidation.missingFields.map(field => `Rookie: ${field}`));
        errors.push(...rookieValidation.errors);
      }

      const isComplete = missingFields.length === 0 && errors.length === 0;

      return {
        isComplete,
        missingFields,
        errors
      };
    } catch (error) {
      console.error('Error validating profile completion:', error);
      return {
        isComplete: false,
        missingFields: [],
        errors: ['Failed to validate profile']
      };
    }
  }

  /**
   * Validates Tuto profile completion
   */
  private static validateTutoProfile(tutoProfile: any): ProfileValidationResult {
    const missingFields: string[] = [];
    const errors: string[] = [];

    if (!tutoProfile) {
      missingFields.push('Tuto profile not created');
      return { isComplete: false, missingFields, errors };
    }

    // Required fields for Tuto profile
    const requiredFields = [
      'preferredName',
      'selectedAvatar',
      'yearOfStudy',
      'major',
      'teachingBio',
      'ratePerSession',
      'availability',
      'tutoringSubjects'
    ];

    for (const field of requiredFields) {
      if (!tutoProfile[field] || 
          (Array.isArray(tutoProfile[field]) && tutoProfile[field].length === 0)) {
        missingFields.push(field);
      }
    }

    // Validate major against allowed list
    if (tutoProfile.major && !this.isValidMajor(tutoProfile.major)) {
      errors.push('Invalid major selected');
    }

    // Validate year of study
    if (tutoProfile.yearOfStudy && !this.isValidYearOfStudy(tutoProfile.yearOfStudy)) {
      errors.push('Invalid year of study');
    }

    return {
      isComplete: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors
    };
  }

  /**
   * Validates Rookie profile completion
   */
  private static validateRookieProfile(rookieProfile: any): ProfileValidationResult {
    const missingFields: string[] = [];
    const errors: string[] = [];

    if (!rookieProfile) {
      missingFields.push('Rookie profile not created');
      return { isComplete: false, missingFields, errors };
    }

    // Required fields for Rookie profile
    const requiredFields = [
      'preferredName',
      'selectedAvatar',
      'yearOfStudy',
      'major',
      'subjectsSeekingHelp',
      'learningStyle'
    ];

    for (const field of requiredFields) {
      if (!rookieProfile[field] || 
          (Array.isArray(rookieProfile[field]) && rookieProfile[field].length === 0)) {
        missingFields.push(field);
      }
    }

    // Validate major against allowed list
    if (rookieProfile.major && !this.isValidMajor(rookieProfile.major)) {
      errors.push('Invalid major selected');
    }

    // Validate year of study
    if (rookieProfile.yearOfStudy && !this.isValidYearOfStudy(rookieProfile.yearOfStudy)) {
      errors.push('Invalid year of study');
    }

    return {
      isComplete: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors
    };
  }

  /**
   * Updates user's profileCompleted status based on validation
   */
  static async updateProfileCompletionStatus(userId: string): Promise<boolean> {
    try {
      const validation = await this.validateProfileCompletion(userId);
      
      await prisma.user.update({
        where: { id: userId },
        data: { profileCompleted: validation.isComplete }
      });

      return validation.isComplete;
    } catch (error) {
      console.error('Error updating profile completion status:', error);
      return false;
    }
  }

  /**
   * Validates major against allowed list
   */
  private static isValidMajor(major: string): boolean {
    // Use Set for O(1) lookup instead of O(n) array search
    const validMajorsSet = new Set([
      'Computer Science',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Engineering',
      'Business',
      'Economics',
      'Psychology',
      'Sociology',
      'History',
      'English',
      'Philosophy',
      'Political Science',
      'Art',
      'Music',
      'Theater',
      'Communications',
      'Education',
      'Nursing',
      'Medicine',
      'Law',
      'Architecture',
      'Environmental Science',
      'Statistics',
      'Data Science',
      'Information Technology',
      'Cybersecurity',
      'Artificial Intelligence',
      'Mechanical Engineering',
      'Electrical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Biomedical Engineering',
      'Aerospace Engineering',
      'Industrial Engineering',
      'Materials Science',
      'Geology',
      'Astronomy',
      'Neuroscience',
      'Biochemistry',
      'Molecular Biology',
      'Genetics',
      'Ecology',
      'Anthropology',
      'Linguistics',
      'Religious Studies',
      'Women\'s Studies',
      'African American Studies',
      'Latin American Studies',
      'Asian Studies',
      'Middle Eastern Studies',
      'European Studies',
      'International Relations',
      'Public Policy',
      'Social Work',
      'Criminal Justice',
      'Forensic Science',
      'Sports Management',
      'Hospitality Management',
      'Tourism Management',
      'Supply Chain Management',
      'Human Resources',
      'Marketing',
      'Finance',
      'Accounting',
      'Real Estate',
      'Urban Planning',
      'Landscape Architecture',
      'Interior Design',
      'Fashion Design',
      'Graphic Design',
      'Digital Media',
      'Film Studies',
      'Journalism',
      'Public Relations',
      'Advertising',
      'Translation',
      'Library Science',
      'Information Science',
      'Public Health',
      'Nutrition',
      'Exercise Science',
      'Physical Therapy',
      'Occupational Therapy',
      'Speech Therapy',
      'Dental Hygiene',
      'Pharmacy',
      'Veterinary Medicine',
      'Agriculture',
      'Food Science',
      'Textile Science',
      'Fashion Merchandising',
      'Retail Management',
      'Event Management',
      'Nonprofit Management',
      'Public Administration',
      'Military Science',
      'Aviation',
      'Maritime Studies',
      'Oceanography',
      'Meteorology',
      'Climatology',
      'Sustainability',
      'Renewable Energy',
      'Nuclear Engineering',
      'Petroleum Engineering',
      'Mining Engineering',
      'Forestry',
      'Wildlife Biology',
      'Conservation Biology',
      'Marine Biology',
      'Zoology',
      'Botany',
      'Microbiology',
      'Immunology',
      'Virology',
      'Parasitology',
      'Toxicology',
      'Pharmacology',
      'Physiology',
      'Anatomy',
      'Pathology',
      'Radiology',
      'Anesthesiology',
      'Surgery',
      'Pediatrics',
      'Geriatrics',
      'Oncology',
      'Cardiology',
      'Neurology',
      'Psychiatry',
      'Dermatology',
      'Ophthalmology',
      'Orthopedics',
      'Urology',
      'Gynecology',
      'Obstetrics',
      'Emergency Medicine',
      'Family Medicine',
      'Internal Medicine',
      'Preventive Medicine',
      'Occupational Medicine',
      'Sports Medicine',
      'Rehabilitation Medicine',
      'Palliative Care',
      'Hospice Care',
      'Alternative Medicine',
      'Traditional Medicine',
      'Herbal Medicine',
      'Acupuncture',
      'Chiropractic',
      'Naturopathy',
      'Homeopathy',
      'Ayurveda',
      'Traditional Chinese Medicine',
      'Other'
    ]);

    return validMajorsSet.has(major); // O(1) lookup
  }

  /**
   * Validates year of study
   */
  private static isValidYearOfStudy(year: string): boolean {
    const validYears = [
      'Freshman',
      'Sophomore', 
      'Junior',
      'Senior',
      'Graduate Student',
      'PhD Student',
      'Postdoctoral Researcher',
      'Faculty',
      'Alumni',
      'Other'
    ];

    return validYears.includes(year);
  }

  /**
   * Gets profile data for a user
   */
  static async getProfileData(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          tutoProfile: true,
          rookieProfile: true,
          university: {
            select: {
              id: true,
              name: true
            }
          },
          aiConsents: true
        } as any, // Type assertion to any to avoid TS errors for relation fields
      }) as any; // Type assertion to any to avoid TS errors for relation fields

      if (!user) {
        throw new Error('User not found');
      }

      // Find SESSION_SUMMARY consent
      let hasAcceptedAIConsent = false;
      if (user.aiConsents && Array.isArray(user.aiConsents)) {
        const summaryConsent = user.aiConsents.find((c: any) => c.feature === 'SESSION_SUMMARY');
        hasAcceptedAIConsent = !!(summaryConsent && summaryConsent.consented);
      }

      // Convert major string back to array for both profiles
      if (user.tutoProfile && user.tutoProfile.major) {
        user.tutoProfile.majors = user.tutoProfile.major.split(', ').filter((m: string) => m.trim());
      }
      if (user.rookieProfile && user.rookieProfile.major) {
        user.rookieProfile.majors = user.rookieProfile.major.split(', ').filter((m: string) => m.trim());
      }

      return {
        ...user,
        hasAcceptedAIConsent,
        university: user.university,
        tutoProfile: user.tutoProfile,
        rookieProfile: user.rookieProfile
      };
    } catch (error) {
      console.error('Error getting profile data:', error);
      throw error;
    }
  }
} 