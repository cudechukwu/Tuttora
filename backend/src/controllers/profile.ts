import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProfileService } from '../services/profileService';

const prisma = new PrismaClient();

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const profileData = await ProfileService.getProfileData(userId);
    
    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { role, profileData } = req.body;

    if (!role || !profileData) {
      return res.status(400).json({
        success: false,
        message: 'Role and profile data are required'
      });
    }

    // Validate role
    if (!['tuto', 'rookie'].includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "tuto" or "rookie"'
      });
    }

    let result;
    
    if (role.toLowerCase() === 'tuto') {
      // Handle Tuto profile
      result = await prisma.tutoProfile.upsert({
        where: { userId },
        update: {
          preferredName: profileData.preferredName,
          selectedAvatar: profileData.selectedAvatar,
          pronouns: profileData.pronouns,
          yearOfStudy: profileData.yearOfStudy,
          major: Array.isArray(profileData.majors) ? profileData.majors.join(', ') : profileData.major || '',
          gpa: profileData.gpa,
          teachingBio: profileData.teachingBio,
          ratePerSession: profileData.ratePerSession,
          availability: profileData.availability || [],
          certifications: profileData.certifications,
          coursesTaken: profileData.coursesTaken,
          tutoringSubjects: profileData.tutoringSubjects || [],
          tutoringTopics: profileData.tutoringTopics,
          resume: profileData.resume && typeof profileData.resume === 'string' ? profileData.resume : null,
          // New academic fields
          academicStanding: profileData.academicStanding,
          expectedGraduationDate: profileData.expectedGraduationDate ? new Date(profileData.expectedGraduationDate) : null,
          academicAwards: profileData.academicAwards || [],
          researchExperience: profileData.researchExperience
        },
        create: {
          userId,
          preferredName: profileData.preferredName,
          selectedAvatar: profileData.selectedAvatar,
          pronouns: profileData.pronouns,
          yearOfStudy: profileData.yearOfStudy,
          major: Array.isArray(profileData.majors) ? profileData.majors.join(', ') : profileData.major || '',
          gpa: profileData.gpa,
          teachingBio: profileData.teachingBio,
          ratePerSession: profileData.ratePerSession,
          availability: profileData.availability || [],
          certifications: profileData.certifications,
          coursesTaken: profileData.coursesTaken,
          tutoringSubjects: profileData.tutoringSubjects || [],
          tutoringTopics: profileData.tutoringTopics,
          resume: profileData.resume && typeof profileData.resume === 'string' ? profileData.resume : null,
          // New academic fields
          academicStanding: profileData.academicStanding,
          expectedGraduationDate: profileData.expectedGraduationDate ? new Date(profileData.expectedGraduationDate) : null,
          academicAwards: profileData.academicAwards || [],
          researchExperience: profileData.researchExperience
        }
      });
    } else {
      // Handle Rookie profile
      result = await prisma.rookieProfile.upsert({
        where: { userId },
        update: {
          preferredName: profileData.preferredName,
          selectedAvatar: profileData.selectedAvatar,
          pronouns: profileData.pronouns,
          yearOfStudy: profileData.yearOfStudy,
          major: Array.isArray(profileData.majors) ? profileData.majors.join(', ') : profileData.major || '',
          subjectsSeekingHelp: profileData.subjectsSeekingHelp || [],
          learningStyle: profileData.learningStyle || [],
          learningNeeds: profileData.learningNeeds || [],
          tutoringExperience: profileData.tutoringExperience,
          // New academic fields
          academicStanding: profileData.academicStanding,
          expectedGraduationDate: profileData.expectedGraduationDate ? new Date(profileData.expectedGraduationDate) : null,
          academicAwards: profileData.academicAwards || [],
          researchExperience: profileData.researchExperience
        },
        create: {
          userId,
          preferredName: profileData.preferredName,
          selectedAvatar: profileData.selectedAvatar,
          pronouns: profileData.pronouns,
          yearOfStudy: profileData.yearOfStudy,
          major: Array.isArray(profileData.majors) ? profileData.majors.join(', ') : profileData.major || '',
          subjectsSeekingHelp: profileData.subjectsSeekingHelp || [],
          learningStyle: profileData.learningStyle || [],
          learningNeeds: profileData.learningNeeds || [],
          tutoringExperience: profileData.tutoringExperience,
          // New academic fields
          academicStanding: profileData.academicStanding,
          expectedGraduationDate: profileData.expectedGraduationDate ? new Date(profileData.expectedGraduationDate) : null,
          academicAwards: profileData.academicAwards || [],
          researchExperience: profileData.researchExperience
        }
      });
    }

    // Update role-specific completion status
    const updateData: any = {};
    if (role.toLowerCase() === 'tuto') {
      updateData.tutoProfileCompleted = true;
    } else {
      updateData.rookieProfileCompleted = true;
    }

    // Get current user to check role and determine overall profile completion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        rookieProfileCompleted: true,
        tutoProfileCompleted: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine overall profile completion based on user's role
    let profileCompleted = false;
    if (user.role === 'ROOKIE') {
      profileCompleted = updateData.rookieProfileCompleted || user.rookieProfileCompleted;
    } else if (user.role === 'TUTO') {
      profileCompleted = updateData.tutoProfileCompleted || user.tutoProfileCompleted;
    } else if (user.role === 'BOTH') {
      // For BOTH role, user needs both profiles completed
      const newRookieCompleted = updateData.rookieProfileCompleted || user.rookieProfileCompleted;
      const newTutoCompleted = updateData.tutoProfileCompleted || user.tutoProfileCompleted;
      profileCompleted = newRookieCompleted && newTutoCompleted;
    }

    updateData.profileCompleted = profileCompleted;

    // Update user's profile completion status
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result,
      profileCompleted,
      roleCompleted: {
        rookie: updateData.rookieProfileCompleted || user.rookieProfileCompleted,
        tuto: updateData.tutoProfileCompleted || user.tutoProfileCompleted
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProfileCompletionStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileCompleted: true,
        rookieProfileCompleted: true,
        tutoProfileCompleted: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        profileCompleted: user.profileCompleted,
        rookieProfileCompleted: user.rookieProfileCompleted,
        tutoProfileCompleted: user.tutoProfileCompleted,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error fetching profile completion status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const validateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tutoProfile: true,
        rookieProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate based on user's role
    let isValid = false;
    let missingFields: string[] = [];

    if (user.role === 'TUTO') {
      if (user.tutoProfile) {
        const requiredFields = ['preferredName', 'selectedAvatar', 'pronouns', 'yearOfStudy', 'major', 'teachingBio'];
        missingFields = requiredFields.filter(field => !user.tutoProfile![field as keyof typeof user.tutoProfile]);
        isValid = missingFields.length === 0;
      }
    } else if (user.role === 'ROOKIE') {
      if (user.rookieProfile) {
        const requiredFields = ['preferredName', 'selectedAvatar', 'pronouns', 'yearOfStudy', 'major'];
        missingFields = requiredFields.filter(field => !user.rookieProfile![field as keyof typeof user.rookieProfile]);
        isValid = missingFields.length === 0;
      }
    } else if (user.role === 'BOTH') {
      // For BOTH role, check if at least one profile is complete
      const tutoValid = !!(user.tutoProfile && ['preferredName', 'selectedAvatar', 'pronouns', 'yearOfStudy', 'major', 'teachingBio']
        .every(field => user.tutoProfile![field as keyof typeof user.tutoProfile]));
      
      const rookieValid = !!(user.rookieProfile && ['preferredName', 'selectedAvatar', 'pronouns', 'yearOfStudy', 'major']
        .every(field => user.rookieProfile![field as keyof typeof user.rookieProfile]));
      
      isValid = tutoValid || rookieValid;
      
      if (!isValid) {
        missingFields = ['At least one role profile must be completed'];
      }
    }

    res.json({
      success: true,
      data: {
        isValid,
        missingFields,
        role: user.role,
        hasTutoProfile: !!user.tutoProfile,
        hasRookieProfile: !!user.rookieProfile
      }
    });
  } catch (error) {
    console.error('Error validating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getValidMajors = async (req: Request, res: Response) => {
  try {
    const validMajors = [
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
    ];

    res.json({
      success: true,
      data: validMajors
    });
  } catch (error) {
    console.error('Error fetching valid majors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch valid majors'
    });
  }
};

export const getValidYearsOfStudy = async (req: Request, res: Response) => {
  try {
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

    res.json({
      success: true,
      data: validYears
    });
  } catch (error) {
    console.error('Error fetching valid years of study:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch valid years of study'
    });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { role } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!role || !['ROOKIE', 'TUTO', 'BOTH'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be ROOKIE, TUTO, or BOTH' });
    }
    // Fetch current user and profile flags
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        profileCompleted: true,
        rookieProfileCompleted: true,
        tutoProfileCompleted: true
      }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Determine new completion flags
    let updateData: any = { role };
    if (role === 'ROOKIE') {
      updateData.profileCompleted = user.rookieProfileCompleted;
    } else if (role === 'TUTO') {
      updateData.profileCompleted = user.tutoProfileCompleted;
    } else if (role === 'BOTH') {
      // If switching to BOTH, keep existing flags, but profileCompleted is true only if both are true
      updateData.profileCompleted = user.rookieProfileCompleted && user.tutoProfileCompleted;
    }
    // Optionally, if switching to BOTH and one profile is missing, set that flag to false
    if (role === 'BOTH') {
      if (!user.rookieProfileCompleted) updateData.rookieProfileCompleted = false;
      if (!user.tutoProfileCompleted) updateData.tutoProfileCompleted = false;
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        role: true,
        profileCompleted: true,
        rookieProfileCompleted: true,
        tutoProfileCompleted: true
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const saveOnboardingData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { role, onboardingData } = req.body;

    if (!role || !onboardingData) {
      return res.status(400).json({
        success: false,
        message: 'Role and onboarding data are required'
      });
    }

    // Validate role
    if (!['tuto', 'rookie'].includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "tuto" or "rookie"'
      });
    }

    let result;
    
    if (role.toLowerCase() === 'tuto') {
      // Handle Tuto onboarding
      result = await prisma.tutoProfile.upsert({
        where: { userId },
        update: {
          preferredName: onboardingData.preferredName,
          selectedAvatar: onboardingData.avatar,
          pronouns: onboardingData.pronouns,
          yearOfStudy: onboardingData.yearOfStudy,
          major: Array.isArray(onboardingData.selectedMajors) ? onboardingData.selectedMajors.join(', ') : '',
          tutoringSubjects: onboardingData.subjects || [],
          teachingBio: onboardingData.teachingBio || '',
          ratePerSession: onboardingData.ratePerSession || '',
          availability: onboardingData.availability || [],
          certifications: onboardingData.certifications || '',
          gpa: onboardingData.gpa || '',
          // Academic fields
          academicStanding: onboardingData.academicStanding,
          expectedGraduationDate: onboardingData.expectedGraduationDate ? new Date(onboardingData.expectedGraduationDate) : null,
          academicAwards: onboardingData.academicAwards || [],
          researchExperience: onboardingData.researchExperience
        },
        create: {
          userId,
          preferredName: onboardingData.preferredName,
          selectedAvatar: onboardingData.avatar,
          pronouns: onboardingData.pronouns,
          yearOfStudy: onboardingData.yearOfStudy,
          major: Array.isArray(onboardingData.selectedMajors) ? onboardingData.selectedMajors.join(', ') : '',
          tutoringSubjects: onboardingData.subjects || [],
          teachingBio: onboardingData.teachingBio || '',
          ratePerSession: onboardingData.ratePerSession || '',
          availability: onboardingData.availability || [],
          certifications: onboardingData.certifications || '',
          gpa: onboardingData.gpa || '',
          // Academic fields
          academicStanding: onboardingData.academicStanding,
          expectedGraduationDate: onboardingData.expectedGraduationDate ? new Date(onboardingData.expectedGraduationDate) : null,
          academicAwards: onboardingData.academicAwards || [],
          researchExperience: onboardingData.researchExperience
        }
      });
    } else {
      // Handle Rookie onboarding
      result = await prisma.rookieProfile.upsert({
        where: { userId },
        update: {
          preferredName: onboardingData.preferredName,
          selectedAvatar: onboardingData.avatar,
          pronouns: onboardingData.pronouns,
          yearOfStudy: onboardingData.yearOfStudy,
          major: Array.isArray(onboardingData.selectedMajors) ? onboardingData.selectedMajors.join(', ') : '',
          subjectsSeekingHelp: onboardingData.subjects || [],
          learningStyle: onboardingData.learningStyle || [],
          tutoringExperience: onboardingData.tutoringExperience || '',
          learningNeeds: onboardingData.learningNeeds || [],
          // Academic fields
          academicStanding: onboardingData.academicStanding,
          expectedGraduationDate: onboardingData.expectedGraduationDate ? new Date(onboardingData.expectedGraduationDate) : null,
          academicAwards: onboardingData.academicAwards || [],
          researchExperience: onboardingData.researchExperience
        },
        create: {
          userId,
          preferredName: onboardingData.preferredName,
          selectedAvatar: onboardingData.avatar,
          pronouns: onboardingData.pronouns,
          yearOfStudy: onboardingData.yearOfStudy,
          major: Array.isArray(onboardingData.selectedMajors) ? onboardingData.selectedMajors.join(', ') : '',
          subjectsSeekingHelp: onboardingData.subjects || [],
          learningStyle: onboardingData.learningStyle || [],
          tutoringExperience: onboardingData.tutoringExperience || '',
          learningNeeds: onboardingData.learningNeeds || [],
          // Academic fields
          academicStanding: onboardingData.academicStanding,
          expectedGraduationDate: onboardingData.expectedGraduationDate ? new Date(onboardingData.expectedGraduationDate) : null,
          academicAwards: onboardingData.academicAwards || [],
          researchExperience: onboardingData.researchExperience
        }
      });
    }

    res.json({
      success: true,
      message: 'Onboarding data saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 