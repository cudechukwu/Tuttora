import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SessionStatus } from '@prisma/client';
import { SessionService } from '../services/sessionService';
import { dailyService } from '../services/dailyService';
import { DashboardService } from '../services/dashboardService';


const prisma = new PrismaClient();

// Import socket service for real-time updates
let socketService: any = null;

// Function to set socket service (called from index.ts)
export const setSocketService = (service: any) => {
  socketService = service;
};

// Types for session requests
interface CreateSessionRequestData {
  subject: string;
  topic?: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  courseId?: string; // Optional course ID for better matching
}

interface RateSessionData {
  rating: number; // 1-5
  feedback?: string;
  isAnonymous?: boolean;
}

// Create a new session request (Rookie creates this)
export const createSessionRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { subject, topic, description, urgency, courseId }: CreateSessionRequestData = req.body;

    // Validate required fields
    if (!subject || !description || !urgency) {
      return res.status(400).json({
        error: 'Missing required fields: subject, description, urgency'
      });
    }

    // Validate urgency level
    if (!['low', 'medium', 'high'].includes(urgency)) {
      return res.status(400).json({
        error: 'Invalid urgency level. Must be low, medium, or high'
      });
    }

    // Check if user is a rookie
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ROOKIE') {
      return res.status(403).json({
        error: 'Only rookies can create session requests'
      });
    }

    // Check if rookie already has a pending request (to prevent spam)
    const existingRequest = await prisma.session.findFirst({
      where: {
        rookieId: userId,
        status: SessionStatus.REQUESTED,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
        }
      }
    });

    if (existingRequest) {
      return res.status(429).json({
        error: 'You already have a pending session request. Please wait for it to be accepted or withdrawn before creating a new one.'
      });
    }

    // Create the session request
    const sessionData: any = {
      status: SessionStatus.REQUESTED,
      startTime: new Date(), // Will be updated when accepted
      rookieId: userId,
      // Store subject and topic in notes for now (we can add dedicated fields later)
      notes: `Subject: ${subject}${topic ? ` | Topic: ${topic}` : ''} | Description: ${description} | Urgency: ${urgency}`
    };
    
    if (courseId) {
      sessionData.courseId = courseId;
    }
    
    const sessionRequest = await prisma.session.create({
      data: sessionData,
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true
          }
        }
      }
    });

    // Emit real-time update to all tutos
    if (socketService) {
      socketService.notifyNewSessionRequest({
        id: sessionRequest.id,
        notes: sessionRequest.notes, // Include the notes field for proper formatting
        subject: subject,
        topic: topic,
        description: description,
        urgency: urgency,
        courseId: courseId,
        rookie: sessionRequest.rookie,
        course: sessionRequest.course,
        createdAt: sessionRequest.createdAt
      });
    }



    res.status(201).json({
      message: 'Session request created successfully',
      request: sessionRequest
    });

  } catch (error) {
    console.error('Error creating session request:', error);
    res.status(500).json({
      error: 'Failed to create session request'
    });
  }
};

// Get available session requests (Tutos see this)
export const getAvailableRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Check if user is a tuto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'TUTO') {
      return res.status(403).json({
        error: 'Only tutos can view session requests'
      });
    }

    // Get tuto's expertise areas (courses they can teach)
    const tutoExpertise = await prisma.userCourse.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      include: {
        course: true
      }
    });

    console.log('getAvailableRequests - tutoExpertise:', tutoExpertise.map(exp => ({
      courseId: exp.course.id,
      courseTitle: exp.course.title,
      proficiencyLevel: exp.proficiencyLevel
    })));

    // Extract course IDs and department names for filtering
    const tutoCourseIds = tutoExpertise.map(exp => exp.course.id);
    const tutoDepartments = [...new Set(tutoExpertise.map(exp => exp.course.department))];
    
    console.log('getAvailableRequests - tutoCourseIds:', tutoCourseIds);
    console.log('getAvailableRequests - tutoDepartments:', tutoDepartments);

    // Get all pending requests that match tuto's expertise and haven't been rejected by this tuto
    const requests = await prisma.session.findMany({
      where: {
        status: SessionStatus.REQUESTED,
        tutoId: undefined, // Not yet accepted
        // Exclude requests that this tuto has already rejected
        rejections: {
          none: {
            tutoId: userId
          }
        },
        OR: [
          // Direct course match - highest priority
          {
            courseId: {
              in: tutoCourseIds
            }
          },
          // Department match for requests with courseId but different course
          {
            course: {
              department: {
                in: tutoDepartments
              }
            }
          },
          // Subject/topic match in notes (for any request)
          {
            OR: [
              // Match by department names in notes
              ...tutoDepartments.map(dept => ({
                notes: {
                  contains: dept,
                  mode: 'insensitive' as const
                }
              })),
              // Match by common subject keywords
              ...getSubjectKeywords(tutoDepartments).map(keyword => ({
                notes: {
                  contains: keyword,
                  mode: 'insensitive' as const
                }
              }))
            ]
          }
        ]
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' } // Most recent first
      ]
    });

    console.log('getAvailableRequests - found requests:', requests.map(req => ({
      id: req.id,
      courseId: req.courseId,
      courseTitle: req.course?.title,
      title: req.title
    })));

    // Post-process to add match quality and filter out weak matches
    const processedRequests = await Promise.all(requests.map(async request => {
      let matchQuality = await calculateWeightedMatchQuality(request, tutoExpertise, tutoCourseIds, tutoDepartments);
        
        // Fallback logic: Show low-quality matches to generalist tutors
        if (matchQuality < 0.3 && tutoExpertise.length > 5) {
          matchQuality = 0.1; // Low priority but visible to generalists
        }
        
        return { ...request, matchQuality };
    }));

    res.json({
      requests: processedRequests.map(request => ({
        ...request,
        matchLabel: getMatchQualityLabel(request.matchQuality)
      })),
      total: processedRequests.length,
      tutoExpertise: tutoExpertise.map(exp => ({
        courseId: exp.course.id,
        courseTitle: exp.course.title,
        courseCode: exp.course.code,
        department: exp.course.department,
        expertiseLevel: exp.expertiseLevel,
        proficiencyLevel: exp.proficiencyLevel,
        semesterTaken: exp.semesterTaken,
        yearCompleted: exp.yearCompleted
      }))
    });

  } catch (error) {
    console.error('Error fetching available requests:', error);
    res.status(500).json({
      error: 'Failed to fetch available requests'
    });
  }
};

// Helper function to get match quality label for frontend display
function getMatchQualityLabel(quality: number): string {
  if (quality >= 1.0) return "Perfect Match";
  if (quality >= 0.8) return "Excellent Fit";
  if (quality >= 0.6) return "Good Match";
  if (quality >= 0.4) return "Related Topic";
  if (quality >= 0.2) return "General Match";
  return "Fallback Match";
}

// Enhanced subject keywords with synonyms and variations
function getSubjectKeywords(departments: string[]): string[] {
  const enhancedSubjectMap: { [key: string]: string[] } = {
    'COMP': [
      'computer', 'programming', 'program', 'coding', 'code', 'software', 'algorithm', 'algorithms',
      'data structure', 'data structures', 'database', 'databases', 'web development', 'app development',
      'javascript', 'python', 'java', 'c++', 'html', 'css', 'react', 'node', 'api', 'backend', 'frontend'
    ],
    'MATH': [
      'mathematics', 'math', 'calculus', 'algebra', 'statistics', 'geometry', 'trigonometry', 'trig',
      'equation', 'equations', 'formula', 'formulas', 'derivative', 'derivatives', 'integral', 'integrals',
      'linear algebra', 'differential equations', 'probability', 'discrete math', 'number theory'
    ],
    'PHYS': [
      'physics', 'mechanics', 'thermodynamics', 'electromagnetism', 'quantum', 'quantum physics',
      'classical mechanics', 'wave', 'waves', 'energy', 'force', 'forces', 'motion', 'gravity',
      'electricity', 'magnetism', 'optics', 'relativity', 'nuclear physics'
    ],
    'CHEM': [
      'chemistry', 'organic', 'inorganic', 'biochemistry', 'molecular', 'chemical', 'reaction',
      'reactions', 'compound', 'compounds', 'molecule', 'molecules', 'atom', 'atoms', 'bond',
      'bonds', 'acid', 'acids', 'base', 'bases', 'stoichiometry', 'thermochemistry'
    ],
    'BIOL': [
      'biology', 'genetics', 'ecology', 'microbiology', 'anatomy', 'physiology', 'cell', 'cells',
      'organism', 'organisms', 'evolution', 'dna', 'rna', 'protein', 'proteins', 'enzyme',
      'enzymes', 'metabolism', 'photosynthesis', 'respiration', 'ecosystem'
    ],
    'ECON': [
      'economics', 'econ', 'microeconomics', 'macroeconomics', 'finance', 'business', 'accounting',
      'market', 'markets', 'supply', 'demand', 'price', 'prices', 'cost', 'costs', 'profit',
      'profits', 'revenue', 'investment', 'investments', 'trade', 'trading', 'gdp', 'inflation'
    ],
    'ENGL': [
      'english', 'literature', 'writing', 'composition', 'grammar', 'essay', 'essays', 'poetry',
      'poem', 'poems', 'novel', 'novels', 'fiction', 'non-fiction', 'rhetoric', 'analysis',
      'thesis', 'argument', 'arguments', 'research paper', 'creative writing'
    ],
    'HIST': [
      'history', 'historical', 'ancient', 'modern', 'world history', 'civilization', 'civilizations',
      'war', 'wars', 'revolution', 'revolutions', 'empire', 'empires', 'culture', 'cultures',
      'politics', 'political', 'government', 'society', 'social', 'medieval', 'renaissance'
    ],
    'PSYC': [
      'psychology', 'cognitive', 'behavioral', 'social psychology', 'mental', 'behavior', 'behaviors',
      'learning', 'memory', 'perception', 'emotion', 'emotions', 'personality', 'development',
      'therapy', 'clinical', 'neuroscience', 'brain', 'consciousness', 'motivation'
    ],
    'PHIL': [
      'philosophy', 'ethics', 'logic', 'metaphysics', 'epistemology', 'moral', 'morality',
      'argument', 'arguments', 'reasoning', 'critical thinking', 'ethics', 'aesthetics',
      'political philosophy', 'existentialism', 'utilitarianism', 'virtue ethics'
    ],
    'FILM': [
      'film', 'cinema', 'movie', 'movies', 'video', 'editing', 'director', 'directing',
      'cinematography', 'screenplay', 'script', 'scripts', 'production', 'post-production',
      'camera', 'lighting', 'sound', 'visual effects', 'documentary', 'narrative'
    ],
    'MUSC': [
      'music', 'musical', 'composition', 'theory', 'harmony', 'melody', 'rhythm', 'chord',
      'chords', 'scale', 'scales', 'instrument', 'instruments', 'orchestra', 'ensemble',
      'performance', 'recording', 'production', 'arrangement', 'improvisation'
    ],
    'ART': [
      'art', 'artistic', 'painting', 'drawing', 'sculpture', 'design', 'creative', 'visual',
      'color', 'composition', 'perspective', 'medium', 'media', 'gallery', 'exhibition',
      'contemporary', 'modern', 'classical', 'abstract', 'realism'
    ]
  };

  const keywords: string[] = [];
  departments.forEach(dept => {
    if (enhancedSubjectMap[dept]) {
      keywords.push(...enhancedSubjectMap[dept]);
    }
  });

  return keywords;
}

// Helper function to get current semester
function getCurrentSemester(): string {
  const month = new Date().getMonth();
  if (month >= 8 || month <= 0) return 'FALL'; // August to December
  if (month >= 1 && month <= 4) return 'SPRING'; // January to April
  if (month >= 5 && month <= 7) return 'SUMMER'; // May to July
  return 'FALL'; // Default fallback
}

// Helper function to calculate recency boost
function getRecencyBoost(semester: string | null, year: number | null): number {
  if (!semester || !year) return 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentSemester = getCurrentSemester();

  const yearDiff = currentYear - year;

  if (yearDiff === 0 && semester === currentSemester) return 0.3;
  if (yearDiff === 0) return 0.25;
  if (yearDiff === 1) return 0.2;
  if (yearDiff === 2) return 0.15;
  if (yearDiff === 3) return 0.1;
  return 0;
}

// Helper function to calculate proficiency boost
function getProficiencyBoost(proficiencyLevel: string | null): number {
  if (!proficiencyLevel) return 0;
  
  switch (proficiencyLevel) {
    case 'CURRENTLY_TAKING':
      return 0.1;
    case 'TOOK_COURSE':
      return 0.2;
    case 'GOT_A':
      return 0.3;
    case 'TUTORED_BEFORE':
      return 0.4;
    case 'TAED':
      return 0.5;
    default:
      return 0;
  }
}

// Helper function to tokenize and normalize text for NLP
function tokenizeText(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out very short words
    .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)); // Remove common stop words
}

// Helper function to calculate TF-IDF vector for a text
function calculateTFIDF(text: string): Map<string, number> {
  const tokens = tokenizeText(text);
  const tf = new Map<string, number>();
  
  // Calculate term frequency
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  
  // Normalize by document length
  const docLength = tokens.length;
  for (const [term, freq] of tf) {
    tf.set(term, freq / docLength);
  }
  
  return tf;
}

// Helper function to calculate cosine similarity between two TF-IDF vectors
function calculateCosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const term of allTerms) {
    const val1 = vec1.get(term) || 0;
    const val2 = vec2.get(term) || 0;
    
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

// Helper function to get course title similarity using TF-IDF and cosine similarity
function getCourseTitleSimilarity(title1: string, title2: string): number {
  if (!title1 || !title2) return 0;
  
  const tfidf1 = calculateTFIDF(title1);
  const tfidf2 = calculateTFIDF(title2);
  
  return calculateCosineSimilarity(tfidf1, tfidf2);
}

// Helper function to calculate course score (0-1)
function calculateCourseScore(request: any, tutoExpertise: any[]): number {
  console.log('calculateCourseScore - request.courseId:', request.courseId);
  console.log('calculateCourseScore - tutoExpertise:', tutoExpertise.map(exp => ({ courseId: exp.course.id, courseTitle: exp.course.title, department: exp.course.department })));
  
  // If we have a direct course match, that's the best case
  if (request.courseId) {
    const matchingCourse = tutoExpertise.find(exp => exp.course.id === request.courseId);
    console.log('calculateCourseScore - direct course match:', matchingCourse);
    
    if (matchingCourse) {
      let score = 1.0; // Base perfect score for direct course match
      
      // Apply proficiency boost (no recency here - that's handled separately)
      if (matchingCourse.proficiencyLevel) {
        const proficiencyBoost = getProficiencyBoost(matchingCourse.proficiencyLevel);
        score = Math.min(1.0, score + proficiencyBoost);
      }
      
      console.log('calculateCourseScore - direct course match score:', score);
      return score;
    }
  }
  
  // If no direct course match, try to match by subject/department from request notes
  if (request.notes) {
    const notes = request.notes.toLowerCase();
    
    // Look for department matches in the notes
    const tutoDepartments = [...new Set(tutoExpertise.map(exp => exp.course.department.toLowerCase()))];
    
    for (const department of tutoDepartments) {
      if (notes.includes(department)) {
        // Find the best matching course in this department
        const departmentCourses = tutoExpertise.filter(exp => 
          exp.course.department.toLowerCase() === department
        );
        
        if (departmentCourses.length > 0) {
          // Find the course with the highest proficiency level
          const bestCourse = departmentCourses.reduce((best, current) => {
            const currentBoost = current.proficiencyLevel ? getProficiencyBoost(current.proficiencyLevel) : 0;
            const bestBoost = best.proficiencyLevel ? getProficiencyBoost(best.proficiencyLevel) : 0;
            return currentBoost > bestBoost ? current : best;
          });
          
          let score = 0.8; // High score for department match
          
          // Apply proficiency boost
          if (bestCourse.proficiencyLevel) {
            const proficiencyBoost = getProficiencyBoost(bestCourse.proficiencyLevel);
            score = Math.min(1.0, score + proficiencyBoost);
          }
          
          console.log('calculateCourseScore - department match score:', score, 'for department:', department);
          return score;
        }
      }
    }
  }
  
  console.log('calculateCourseScore - no match found, returning 0');
  return 0;
}

// Helper function to calculate department score (0-1) with NLP validation
async function calculateDepartmentScore(request: any, tutoExpertise: any[]): Promise<number> {
  if (!request.courseId) return 0;
  
  // Get request course department
  const requestCourse = await prisma.course.findUnique({
    where: { id: request.courseId },
    select: { department: true, title: true }
  });
  
  if (!requestCourse) return 0;
  
  // Check if any tuto course is in the same department
  const sameDepartmentCourses = tutoExpertise.filter(exp => 
    exp.course.department === requestCourse.department
  );
  
  if (sameDepartmentCourses.length === 0) return 0;
  
  // Find the best matching course in the department
  const bestCourse = sameDepartmentCourses.reduce((best, current) => {
    const currentBoost = current.proficiencyLevel ? getProficiencyBoost(current.proficiencyLevel) : 0;
    const bestBoost = best.proficiencyLevel ? getProficiencyBoost(best.proficiencyLevel) : 0;
    return currentBoost > bestBoost ? current : best;
  });
  
  // NLP Validation: Check title similarity for department matches
  const titleSimilarity = getCourseTitleSimilarity(requestCourse.title, bestCourse.course.title);
  
  // If similarity is too low, discard the department match
  if (titleSimilarity < 0.4) {
    return 0; // Too dissimilar → discard department match
  }
  
  let score = 0.7; // Base score for department match
  
  // Apply proficiency boost for best matching course in department
  if (bestCourse.proficiencyLevel) {
    const proficiencyBoost = getProficiencyBoost(bestCourse.proficiencyLevel);
    score = Math.min(1.0, score + proficiencyBoost);
  }
  
  // Apply title similarity as a multiplier (0.4-1.0 range)
  const similarityMultiplier = Math.max(0.4, titleSimilarity);
  score = score * similarityMultiplier;
  
  return score;
}

// Helper function to calculate keyword score (0-1)
function calculateKeywordScore(request: any, tutoExpertise: any[]): number {
  if (!request.notes || !request.notes.trim()) return 0;
  
  const requestText = request.notes.toLowerCase();
  const allTutoKeywords = tutoExpertise.flatMap(exp => [
    exp.course.title.toLowerCase(),
    exp.course.code.toLowerCase(),
    exp.course.department.toLowerCase()
  ]);
  
  // Extract meaningful keywords from the request
  const requestKeywords = requestText
    .split(/\s+/)
    .filter((word: string) => word.length >= 3) // Skip very short words
    .filter((word: string) => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'subject', 'topic', 'description', 'urgency'].includes(word));
  
  let keywordMatches = 0;
  let totalScore = 0;
  
  for (const keyword of requestKeywords) {
    for (const tutoKeyword of allTutoKeywords) {
      if (tutoKeyword.includes(keyword) || keyword.includes(tutoKeyword)) {
        keywordMatches++;
        totalScore += 0.15; // Slightly higher score per match
        break;
      }
    }
  }
  
  // Cap keyword score at 0.5
  let score = Math.min(0.5, totalScore);
  
  // Boost score if we have multiple keyword matches
  if (keywordMatches >= 3) {
    score = Math.min(0.6, score + 0.1);
  }
  
  console.log('calculateKeywordScore - keywords:', requestKeywords, 'matches:', keywordMatches, 'score:', score);
  return score;
}

// Helper function to calculate recency score (0-1)
function calculateRecencyScore(request: any, tutoExpertise: any[]): number {
  if (!request.courseId) return 0;
  
  const matchingCourse = tutoExpertise.find(exp => exp.course.id === request.courseId);
  if (!matchingCourse) return 0;
  
  return getRecencyBoost(matchingCourse.semesterTaken, matchingCourse.yearCompleted);
}

// Helper function to calculate weighted match quality
async function calculateWeightedMatchQuality(
  request: any, 
  tutoExpertise: any[], 
  tutoCourseIds: string[], 
  tutoDepartments: string[]
): Promise<number> {
  console.log('calculateWeightedMatchQuality - request:', { courseId: request.courseId, title: request.title });
  console.log('calculateWeightedMatchQuality - tutoCourseIds:', tutoCourseIds);
  
  // Calculate individual scores
  const courseScore = calculateCourseScore(request, tutoExpertise);
  const departmentScore = await calculateDepartmentScore(request, tutoExpertise);
  const keywordScore = calculateKeywordScore(request, tutoExpertise);
  const recencyScore = calculateRecencyScore(request, tutoExpertise);
  
  console.log('calculateWeightedMatchQuality - scores:', { courseScore, departmentScore, keywordScore, recencyScore });
  
  // Weighted formula (recency is separate, not double-counted)
  const matchQuality = (
    0.5 * courseScore +
    0.2 * departmentScore +
    0.2 * keywordScore +
    0.1 * recencyScore
  );
  
  console.log('calculateWeightedMatchQuality - final matchQuality:', matchQuality);
  return Math.min(1.0, matchQuality);
}

// Accept a session request (Tuto accepts)
export const acceptSessionRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;

    // Check if user is a tuto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'TUTO') {
      return res.status(403).json({
        error: 'Only tutos can accept session requests'
      });
    }

    // Find the session request
    const sessionRequest = await prisma.session.findUnique({
      where: { id: requestId },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    if (!sessionRequest) {
      return res.status(404).json({
        error: 'Session request not found'
      });
    }

    if (sessionRequest.status !== SessionStatus.REQUESTED) {
      return res.status(400).json({
        error: 'Session request is no longer available'
      });
    }

    if (sessionRequest.tutoId) {
      return res.status(400).json({
        error: 'Session request has already been accepted'
      });
    }

    // Check if this tuto already has an active session with this rookie
    const existingActiveSession = await prisma.session.findFirst({
      where: {
        tutoId: userId,
        rookieId: sessionRequest.rookieId,
        status: {
          in: [SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS]
        }
      }
    });

    if (existingActiveSession) {
      return res.status(400).json({
        error: 'You already have an active session with this student. Please complete the current session first.'
      });
    }

    // Set grace period when Tuto accepts
    const gracePeriodMinutes = 5;
    const acceptedAt = new Date();
    const gracePeriodEnd = new Date(acceptedAt.getTime() + (gracePeriodMinutes * 60 * 1000));

    // Create Daily.co room for video call
    let dailyRoomData: any = {};
    try {
      const dailyRoom = await dailyService.createRoom(requestId);
      dailyRoomData = {
        dailyRoomName: dailyRoom.name,
        dailyRoomUrl: dailyRoom.url
      };
      console.log(`Daily.co room created for session ${requestId}: ${dailyRoom.url}`);
    } catch (error) {
      console.error(`Failed to create Daily.co room for session ${requestId}:`, error);
      // Continue with session acceptance even if room creation fails
      // Room can be created later if needed
    }

    // Update the session to accepted status (removing grace period step)
    const updatedSession = await prisma.session.update({
      where: { id: requestId },
      data: {
        status: SessionStatus.ACCEPTED,
        tutoId: userId,
        acceptedAt: acceptedAt,
        ...dailyRoomData
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Emit real-time update to all users
    if (socketService) {
      socketService.notifySessionRequestAccepted(requestId);
      socketService.notifySessionStatusChanged({
        sessionId: requestId,
        status: SessionStatus.ACCEPTED,
        session: updatedSession
      });
    }



    res.json({
      message: 'Session request accepted successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error accepting session request:', error);
    res.status(500).json({
      error: 'Failed to accept session request'
    });
  }
};

// Start a session (Rookie joins an accepted session)
export const startSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is the Tuto for this session
    if (session.tutoId !== userId) {
      return res.status(403).json({
        error: 'Only the Tuto can start this session'
      });
    }

    // Check if session is in ACCEPTED status
    if (session.status !== SessionStatus.ACCEPTED) {
      return res.status(400).json({
        error: 'Session is not ready to start. Status: ' + session.status
      });
    }

    // Check grace period
    if (session.gracePeriodEnd && new Date() > session.gracePeriodEnd) {
      return res.status(400).json({
        error: 'Grace period has expired. Session has been cancelled.'
      });
    }

    // Update session to IN_PROGRESS
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        startTime: new Date() // Set actual start time when rookie joins
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Emit real-time update to both users
    if (socketService) {
      socketService.notifySessionStarted({
        sessionId: sessionId,
        session: updatedSession
      });
    }

    res.json({
      message: 'Session started successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      error: 'Failed to start session'
    });
  }
};

// Reject a session request (Tuto rejects - hides from their dashboard)
export const rejectSessionRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;

    // Check if user is a tuto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'TUTO') {
      return res.status(403).json({
        error: 'Only tutos can reject session requests'
      });
    }

    // Find the session request
    const sessionRequest = await prisma.session.findUnique({
      where: { id: requestId }
    });

    if (!sessionRequest) {
      return res.status(404).json({
        error: 'Session request not found'
      });
    }

    if (sessionRequest.status !== SessionStatus.REQUESTED) {
      return res.status(400).json({
        error: 'Session request is no longer available'
      });
    }

    // Check if already rejected by this tuto
    const existingRejection = await prisma.rejectedRequest.findUnique({
      where: {
        sessionId_tutoId: {
          sessionId: requestId,
          tutoId: userId
        }
      }
    });

    if (existingRejection) {
      return res.status(400).json({
        error: 'You have already rejected this request'
      });
    }

    // Create rejection record
    await prisma.rejectedRequest.create({
      data: {
        sessionId: requestId,
        tutoId: userId
      }
    });

    // Emit real-time update to all tutos
    if (socketService) {
      socketService.notifySessionRequestRejected({
        id: requestId,
        tutoId: userId,
        sessionRequest: sessionRequest
      });
    }

    res.json({
      message: 'Request hidden from your dashboard',
      requestId: requestId
    });

  } catch (error) {
    console.error('Error rejecting session request:', error);
    res.status(500).json({
      error: 'Failed to reject session request'
    });
  }
};

// Unreject a session request (Tuto undoes their rejection)
export const unrejectSessionRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;

    // Check if user is a tuto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'TUTO') {
      return res.status(403).json({
        error: 'Only tutos can unreject session requests'
      });
    }

    // Find the rejection record
    const rejection = await prisma.rejectedRequest.findUnique({
      where: {
        sessionId_tutoId: {
          sessionId: requestId,
          tutoId: userId
        }
      }
    });

    if (!rejection) {
      return res.status(404).json({
        error: 'No rejection found for this request'
      });
    }

    // Delete the rejection record
    await prisma.rejectedRequest.delete({
      where: {
        sessionId_tutoId: {
          sessionId: requestId,
          tutoId: userId
        }
      }
    });

    res.json({
      message: 'Request restored to your dashboard',
      requestId: requestId
    });

  } catch (error) {
    console.error('Error unrejecting session request:', error);
    res.status(500).json({
      error: 'Failed to unreject session request'
    });
  }
};

// Get active session for current user
export const getActiveSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Find active session where user is either tuto or rookie
    const activeSession = await prisma.session.findFirst({
      where: {
        OR: [
          { tutoId: userId },
          { rookieId: userId }
        ],
        status: {
          in: [SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS]
        }
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 50 // Limit to last 50 messages
        }
      }
    });

    if (!activeSession) {
      return res.status(404).json({
        error: 'No active session found'
      });
    }

    res.json({
      session: activeSession
    });

  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({
      error: 'Failed to fetch active session'
    });
  }
};

// Update session status
export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!Object.values(SessionStatus).includes(status)) {
      return res.status(400).json({
        error: 'Invalid session status'
      });
    }

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You are not authorized to update this session'
      });
    }

    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Emit real-time update
    if (socketService) {
      socketService.notifySessionStatusChanged({
        sessionId: sessionId,
        status: status,
        session: updatedSession
      });
    }

    res.json({
      message: 'Session status updated successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({
      error: 'Failed to update session status'
    });
  }
};

// End session
export const endSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You are not authorized to end this session'
      });
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / (1000 * 60)); // in minutes

    // Update session and increment session count for both users
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        endTime,
        duration
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Increment session count for both rookie and tuto
    await prisma.user.update({
      where: { id: session.rookieId },
      data: { sessionCount: { increment: 1 } }
    });

    if (session.tutoId) {
      await prisma.user.update({
        where: { id: session.tutoId },
        data: { sessionCount: { increment: 1 } }
      });
    }

    // Emit real-time update
    if (socketService) {
      socketService.notifySessionStatusChanged({
        sessionId: sessionId,
        status: SessionStatus.COMPLETED,
        session: updatedSession
      });
    }

    res.json({
      message: 'Session ended successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      error: 'Failed to end session'
    });
  }
};

// Get session history
export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Get user's session history
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { tutoId: userId },
          { rookieId: userId }
        ],
        status: SessionStatus.COMPLETED
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: { endTime: 'desc' },
      skip,
      take: Number(limit)
    });

    // Get total count
    const total = await prisma.session.count({
      where: {
        OR: [
          { tutoId: userId },
          { rookieId: userId }
        ],
        status: SessionStatus.COMPLETED
      }
    });

    res.json({
      sessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({
      error: 'Failed to fetch session history'
    });
  }
};

// Submit session feedback (rating + optional feedback)
export const submitSessionFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { rating, feedback, isAnonymous }: RateSessionData = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You are not authorized to rate this session'
      });
    }

    // Check if session is completed
    if (session.status !== SessionStatus.COMPLETED) {
      return res.status(400).json({
        error: 'Can only rate completed sessions'
      });
    }

    // Determine which user is submitting feedback and store in appropriate field
    const isTuto = session.tutoId === userId;
    const updateData: any = {};
    
    if (isTuto) {
      updateData.tutoRating = rating;
      updateData.tutoFeedback = feedback;
      updateData.tutoAnonymous = isAnonymous || false;
    } else {
      updateData.rookieRating = rating;
      updateData.rookieFeedback = feedback;
      updateData.rookieAnonymous = isAnonymous || false;
    }
    
    // Update session with rating
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Update the average rating for the user who received the feedback
    const userWhoReceivedFeedback = isTuto ? session.rookieId : session.tutoId;
    if (userWhoReceivedFeedback) {
      await DashboardService.updateUserRating(userWhoReceivedFeedback, rating);
    }

    res.json({
      message: 'Session rated successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error rating session:', error);
    res.status(500).json({
      error: 'Failed to rate session'
    });
  }
};

// Get my session requests (Rookie views their own requests)
export const getMyRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Check if user is a rookie
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ROOKIE') {
      return res.status(403).json({
        error: 'Only rookies can view their own requests'
      });
    }

    // Get rookie's session requests
    const requests = await prisma.session.findMany({
      where: {
        rookieId: userId,
        status: {
          in: [SessionStatus.REQUESTED, SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS]
        }
      },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    // Filter out sessions that have exceeded the session duration (60 minutes)
    const now = new Date();
    const sessionDuration = 60; // minutes
    const filteredRequests = requests.filter(session => {
      // For REQUESTED status, don't filter by time (they can stay pending)
      if (session.status === SessionStatus.REQUESTED) {
        return true;
      }
      
      // For ACCEPTED and IN_PROGRESS, check if they've exceeded duration
      const startTime = new Date(session.startTime);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return elapsedMinutes < sessionDuration;
    });

    // Auto-complete sessions that have exceeded the duration
    const sessionsToComplete = requests.filter(session => {
      if (session.status === SessionStatus.REQUESTED) {
        return false; // Don't auto-complete pending requests
      }
      
      const startTime = new Date(session.startTime);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return elapsedMinutes >= sessionDuration;
    });

    // Update sessions that have exceeded duration to COMPLETED status
    for (const session of sessionsToComplete) {
      const startTime = new Date(session.startTime);
      const endTime = new Date(startTime.getTime() + (sessionDuration * 60 * 1000));
      const duration = sessionDuration;

      await prisma.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.COMPLETED,
          endTime,
          duration
        }
      });
    }

    res.json({
      requests: filteredRequests,
      total: filteredRequests.length
    });

  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({
      error: 'Failed to fetch my requests'
    });
  }
};

// Withdraw a session request (Rookie cancels their request)
export const withdrawRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Check if user is a rookie
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ROOKIE') {
      return res.status(403).json({
        error: 'Only rookies can withdraw their requests'
      });
    }

    // Find the session request
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session request not found'
      });
    }

    // Check if this is the rookie's request
    if (session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You can only withdraw your own requests'
      });
    }

    // Check if request can be withdrawn (only REQUESTED status)
    if (session.status !== SessionStatus.REQUESTED) {
      return res.status(400).json({
        error: 'Can only withdraw requests that are still pending'
      });
    }

    // Delete the session request
    await prisma.session.delete({
      where: { id: sessionId }
    });

    res.json({
      message: 'Session request withdrawn successfully'
    });

  } catch (error) {
    console.error('Error withdrawing request:', error);
    res.status(500).json({
      error: 'Failed to withdraw request'
    });
  }
};

// Get my active sessions (Rookie views their active sessions)
export const getMyActiveSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Check if user is a rookie
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ROOKIE') {
      return res.status(403).json({
        error: 'Only rookies can view their active sessions'
      });
    }

    // Get rookie's active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        rookieId: userId,
        status: {
          in: [SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS, SessionStatus.PENDING_CONFIRMATION]
        }
      },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true
          }
        }
      },
      orderBy: [
        { startTime: 'desc' }
      ]
    });

    // Filter out sessions that have exceeded the session duration (60 minutes)
    const now = new Date();
    const sessionDuration = 60; // minutes
    const filteredSessions = activeSessions.filter(session => {
      const startTime = new Date(session.startTime);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return elapsedMinutes < sessionDuration;
    });

    // Auto-complete sessions that have exceeded the duration
    const sessionsToComplete = activeSessions.filter(session => {
      const startTime = new Date(session.startTime);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return elapsedMinutes >= sessionDuration;
    });

    // Update sessions that have exceeded duration to COMPLETED status
    for (const session of sessionsToComplete) {
      const startTime = new Date(session.startTime);
      const endTime = new Date(startTime.getTime() + (sessionDuration * 60 * 1000));
      const duration = sessionDuration;

      await prisma.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.COMPLETED,
          endTime,
          duration
        }
      });
    }

    res.json({
      activeSessions: filteredSessions,
      total: filteredSessions.length
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch active sessions'
    });
  }
};

// Get tuto active sessions (Tuto views their active sessions)
export const getTutoActiveSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Check if user is a tuto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'TUTO') {
      return res.status(403).json({
        error: 'Only tutos can view their active sessions'
      });
    }

    // Get tuto's active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        tutoId: userId,
        status: {
          in: [SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS, SessionStatus.PENDING_CONFIRMATION]
        }
      },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true
          }
        }
      },
      orderBy: [
        { startTime: 'desc' }
      ]
    });

    // Filter out sessions that have exceeded the session duration (60 minutes)
    const now = new Date();
    const sessionDuration = 60; // minutes
    const filteredSessions = activeSessions.filter(session => {
      const startTime = new Date(session.startTime);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return elapsedMinutes < sessionDuration;
    });

    // Auto-complete sessions that have exceeded the duration
    const sessionsToComplete = activeSessions.filter(session => {
      const startTime = new Date(session.startTime);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return elapsedMinutes >= sessionDuration;
    });

    // Update sessions that have exceeded duration to COMPLETED status
    for (const session of sessionsToComplete) {
      const startTime = new Date(session.startTime);
      const endTime = new Date(startTime.getTime() + (sessionDuration * 60 * 1000));
      const duration = sessionDuration;

      await prisma.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.COMPLETED,
          endTime,
          duration
        }
      });
    }

    res.json({
      activeSessions: filteredSessions,
      total: filteredSessions.length
    });

  } catch (error) {
    console.error('Error fetching tuto active sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch active sessions'
    });
  }
}; 

// Validate session access by sessionId
export const validateSessionAccess = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Determine user role in this session
    const userRole = session.tutoId === userId ? 'TUTO' : 'ROOKIE';
    const hasAccess = true;

    // Check if session is ready for video call (ACCEPTED or IN_PROGRESS)
    const canJoinCall = session.status === SessionStatus.ACCEPTED || session.status === SessionStatus.IN_PROGRESS;
    const isActive = session.status === SessionStatus.IN_PROGRESS;

    res.json({
      message: 'Session access validated',
      session: session,
      userRole: userRole,
      hasAccess: hasAccess,
      isActive: isActive,
      canJoinCall: canJoinCall,
      canJoinRoom: canJoinCall, // Backward compatibility
      sessionStatus: session.status,
      // Video call info
      dailyRoomUrl: session.dailyRoomUrl,
      callActive: session.callActive,
      tutoInCall: session.tutoInCall,
      rookieInCall: session.rookieInCall
    });

  } catch (error) {
    console.error('Error validating session access:', error);
    res.status(500).json({
      error: 'Failed to validate session access'
    });
  }
};

// Get Daily room URL for a session
export const getSessionRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        tutoId: true,
        rookieId: true,
        dailyRoomName: true,
        dailyRoomUrl: true,
        callActive: true,
        tutoInCall: true,
        rookieInCall: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Check if session allows video calls
    if (session.status !== SessionStatus.ACCEPTED && session.status !== SessionStatus.IN_PROGRESS && session.status !== SessionStatus.COMPLETED) {
      return res.status(400).json({
        error: 'Session is not ready for video calls',
        sessionStatus: session.status
      });
    }

    // Create room if it doesn't exist
    if (!session.dailyRoomUrl) {
      try {
        const dailyRoom = await dailyService.createRoom(sessionId);
        
        // Update session with room data
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            dailyRoomName: dailyRoom.name,
            dailyRoomUrl: dailyRoom.url
          }
        });

        res.json({
          roomUrl: dailyRoom.url,
          roomName: dailyRoom.name,
          callActive: session.callActive,
          tutoInCall: session.tutoInCall,
          rookieInCall: session.rookieInCall
        });
      } catch (error) {
        console.error('Error creating Daily room:', error);
        res.status(500).json({
          error: 'Failed to create video room'
        });
      }
    } else {
      res.json({
        roomUrl: session.dailyRoomUrl,
        roomName: session.dailyRoomName,
        callActive: session.callActive,
        tutoInCall: session.tutoInCall,
        rookieInCall: session.rookieInCall
      });
    }

  } catch (error) {
    console.error('Error getting session room:', error);
    res.status(500).json({
      error: 'Failed to get session room'
    });
  }
};

// Track user joining video call
export const joinVideoCall = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        tutoId: true,
        rookieId: true,
        tutoInCall: true,
        rookieInCall: true,
        callStartTime: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Determine if user is Tuto or Rookie
    const isTuto = session.tutoId === userId;
    const updateField = isTuto ? 'tutoInCall' : 'rookieInCall';
    const isFirstToJoin = !session.tutoInCall && !session.rookieInCall;

    // Update call state
    const updateData: any = {
      [updateField]: true,
      callActive: true
    };

    // Set call start time if this is the first person to join
    if (isFirstToJoin) {
      updateData.callStartTime = new Date();
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      select: {
        id: true,
        callActive: true,
        tutoInCall: true,
        rookieInCall: true,
        callStartTime: true
      }
    });

    // Emit real-time update
    if (socketService) {
      socketService.sendToRoom(`session-${sessionId}`, 'callStateChanged', {
        sessionId,
        callActive: updatedSession.callActive,
        tutoInCall: updatedSession.tutoInCall,
        rookieInCall: updatedSession.rookieInCall,
        userJoined: isTuto ? 'TUTO' : 'ROOKIE'
      });
    }

    res.json({
      message: 'Joined video call successfully',
      callState: {
        callActive: updatedSession.callActive,
        tutoInCall: updatedSession.tutoInCall,
        rookieInCall: updatedSession.rookieInCall,
        callStartTime: updatedSession.callStartTime
      }
    });

  } catch (error) {
    console.error('Error joining video call:', error);
    res.status(500).json({
      error: 'Failed to join video call'
    });
  }
};

// Track user leaving video call
export const leaveVideoCall = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        tutoId: true,
        rookieId: true,
        tutoInCall: true,
        rookieInCall: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    // Determine if user is Tuto or Rookie
    const isTuto = session.tutoId === userId;
    const updateField = isTuto ? 'tutoInCall' : 'rookieInCall';
    
    // Check if this will be the last person to leave
    const otherUserInCall = isTuto ? session.rookieInCall : session.tutoInCall;
    const willBeEmpty = !otherUserInCall;

    // Update call state
    const updateData: any = {
      [updateField]: false
    };

    // Set callActive to false only if both users have left
    if (willBeEmpty) {
      updateData.callActive = false;
      updateData.callEndTime = new Date();
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      select: {
        id: true,
        callActive: true,
        tutoInCall: true,
        rookieInCall: true,
        callEndTime: true
      }
    });

    // Emit real-time update
    if (socketService) {
      socketService.sendToRoom(`session-${sessionId}`, 'callStateChanged', {
        sessionId,
        callActive: updatedSession.callActive,
        tutoInCall: updatedSession.tutoInCall,
        rookieInCall: updatedSession.rookieInCall,
        userLeft: isTuto ? 'TUTO' : 'ROOKIE'
      });
    }

    res.json({
      message: 'Left video call successfully',
      callState: {
        callActive: updatedSession.callActive,
        tutoInCall: updatedSession.tutoInCall,
        rookieInCall: updatedSession.rookieInCall,
        callEndTime: updatedSession.callEndTime
      }
    });

  } catch (error) {
    console.error('Error leaving video call:', error);
    res.status(500).json({
      error: 'Failed to leave video call'
    });
  }
};

// ===== SESSION PERSISTENCE ENDPOINTS =====

// Get session with timer and messages
export const getSessionWithTimer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Validate access
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session || (session.tutoId !== userId && session.rookieId !== userId)) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    const sessionWithTimer = await SessionService.getSessionWithTimer(sessionId);
    
    res.json({
      session: sessionWithTimer
    });

  } catch (error) {
    console.error('Error getting session with timer:', error);
    res.status(500).json({
      error: 'Failed to get session data'
    });
  }
};

// Save message to session
export const saveSessionMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { content, type = 'text' } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Message content is required'
      });
    }

    // Validate access
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session || (session.tutoId !== userId && session.rookieId !== userId)) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    const message = await SessionService.saveMessage(sessionId, userId, content, type);
    
    res.json({
      message: 'Message saved successfully',
      data: message
    });

  } catch (error) {
    console.error('Error saving session message:', error);
    res.status(500).json({
      error: 'Failed to save message'
    });
  }
};

// Get session messages
export const getSessionMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Validate access
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session || (session.tutoId !== userId && session.rookieId !== userId)) {
      return res.status(403).json({
        error: 'You do not have access to this session'
      });
    }

    const messages = await SessionService.getSessionMessages(sessionId);
    
    res.json({
      messages
    });

  } catch (error) {
    console.error('Error getting session messages:', error);
    res.status(500).json({
      error: 'Failed to get session messages'
    });
  }
}; 

// Get tutor info for modal display
export const getTutorInfo = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;
    
    console.log(`[getTutorInfo] Request for sessionId: ${sessionId}, userId: ${userId}`);

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true
          }
        },
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is the rookie for this session
    if (session.rookieId !== userId) {
      return res.status(403).json({
        error: 'Only the rookie can view tutor info'
      });
    }

    // Check if session is in a valid state for viewing tutor info
    if (session.status !== SessionStatus.PENDING_CONFIRMATION && session.status !== SessionStatus.ACCEPTED) {
      return res.status(400).json({
        error: 'Session is not in a valid state for viewing tutor information'
      });
    }

    if (!session.tutoId) {
      return res.status(400).json({
        error: 'No tutor assigned to this session'
      });
    }

    // Get tutor's expertise and profile
    const tutorExpertise = await prisma.userCourse.findMany({
      where: {
        userId: session.tutoId,
        isActive: true
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true
          }
        }
      }
    });

    // Get tutor's profile
    const tutorProfile = await prisma.tutoProfile.findUnique({
      where: { userId: session.tutoId }
    });

    // Calculate tutor's average rating
    const tutorSessions = await prisma.session.findMany({
      where: {
        tutoId: session.tutoId,
        status: SessionStatus.COMPLETED,
        rating: { not: null }
      },
      select: {
        rating: true
      }
    });

    const averageRating = tutorSessions.length > 0 
      ? tutorSessions.reduce((sum, session) => sum + (session.rating || 0), 0) / tutorSessions.length
      : null;

    // Format tutor info
    const tutorInfo = {
      id: session.tuto?.id || '',
      name: session.tuto ? `${session.tuto.firstName || ''} ${session.tuto.lastName || ''}` : '',
      username: session.tuto?.username || '',
      email: session.tuto?.email || '',
      expertise: tutorExpertise.map(exp => ({
        course: exp.course,
        proficiencyLevel: exp.proficiencyLevel,
        semesterTaken: exp.semesterTaken,
        yearCompleted: exp.yearCompleted
      })),
      profile: tutorProfile,
      rating: averageRating ? {
        average: Math.round(averageRating * 10) / 10,
        count: tutorSessions.length
      } : null,
      gracePeriodEnd: session.gracePeriodEnd,
      timeRemaining: session.gracePeriodEnd ? 
        Math.max(0, Math.floor((new Date(session.gracePeriodEnd).getTime() - new Date().getTime()) / 1000)) : 0
    };

    res.json({
      success: true,
      tutorInfo
    });

  } catch (error) {
    console.error('Error getting tutor info:', error);
    res.status(500).json({
      error: 'Failed to get tutor info'
    });
  }
};

// Cancel session during grace period (Rookie cancels)
export const cancelSessionDuringGracePeriod = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;
    const { reason } = req.body; // Optional reason for analytics

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is the rookie for this session
    if (session.rookieId !== userId) {
      return res.status(403).json({
        error: 'Only the rookie can cancel during grace period'
      });
    }

    // Check if session is in grace period
    if (session.status !== SessionStatus.PENDING_CONFIRMATION) {
      return res.status(400).json({
        error: 'Session is not in grace period'
      });
    }

    if (!session.tutoId) {
      return res.status(400).json({
        error: 'No tutor assigned to this session'
      });
    }

    // Check if grace period has expired
    if (session.gracePeriodEnd && new Date() > session.gracePeriodEnd) {
      return res.status(400).json({
        error: 'Grace period has expired'
      });
    }

    // Add tutor to canceled list and mark session as canceled
    const canceledTutos = session.canceledTutos || [];
    if (!canceledTutos.includes(session.tutoId)) {
      canceledTutos.push(session.tutoId);
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.REQUESTED, // Reset to REQUESTED for new matching
        tutoId: null, // Remove current tutor
        acceptedAt: null,
        gracePeriodEnd: null,
        canceledTutos: canceledTutos,
        rookieCanceledAt: new Date()
      }
    });

    // Notify tutor via WebSocket
    if (socketService) {
      socketService.emitToUser(session.tutoId, 'session_canceled', {
        sessionId,
        message: 'The student canceled the session during the grace period.'
      });
    }

    // Log cancel reason for analytics
    console.log(`Session ${sessionId} canceled by rookie ${userId}. Reason: ${reason || 'Not specified'}`);

    res.json({
      success: true,
      message: 'Session canceled successfully. The request will be sent to other qualified tutors.'
    });

  } catch (error) {
    console.error('Error canceling session during grace period:', error);
    res.status(500).json({
      error: 'Failed to cancel session'
    });
  }
};

// Join session (Rookie confirms during grace period)
export const joinSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is the rookie for this session
    if (session.rookieId !== userId) {
      return res.status(403).json({
        error: 'Only the rookie can join the session'
      });
    }

    // Check if session is in grace period
    if (session.status !== SessionStatus.PENDING_CONFIRMATION) {
      return res.status(400).json({
        error: 'Session is not in grace period'
      });
    }

    if (!session.tutoId) {
      return res.status(400).json({
        error: 'No tutor assigned to this session'
      });
    }

    // Check if grace period has expired
    if (session.gracePeriodEnd && new Date() > session.gracePeriodEnd) {
      return res.status(400).json({
        error: 'Grace period has expired'
      });
    }

    // Update session status to IN_PROGRESS
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        rookieJoinedAt: new Date(),
        startTime: new Date()
      },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true
          }
        }
      }
    });

    // Notify tutor via WebSocket
    if (socketService) {
      socketService.sendToUser(session.tutoId, 'session_started', {
        sessionId,
        message: 'The student has joined the session!'
      });
      
      // Also notify about session status change to IN_PROGRESS
      socketService.notifySessionStatusChanged({
        sessionId,
        status: SessionStatus.IN_PROGRESS,
        session: updatedSession
      });
    }

    res.json({
      success: true,
      message: 'Session started successfully!'
    });

  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({
      error: 'Failed to join session'
    });
  }
}; 

// Accept session (Rookie confirms during grace period - changes status to ACCEPTED)
export const acceptSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is the rookie for this session
    if (session.rookieId !== userId) {
      return res.status(403).json({
        error: 'Only the rookie can accept the session'
      });
    }

    // Check if session is in pending confirmation status
    if (session.status !== SessionStatus.PENDING_CONFIRMATION) {
      return res.status(400).json({
        error: 'Session is not in pending confirmation status'
      });
    }

    if (!session.tutoId) {
      return res.status(400).json({
        error: 'No tutor assigned to this session'
      });
    }

    // Check if grace period has expired
    if (session.gracePeriodEnd && new Date() > session.gracePeriodEnd) {
      return res.status(400).json({
        error: 'Grace period has expired'
      });
    }

    // Update session status to ACCEPTED
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ACCEPTED,
        rookieAcceptedAt: new Date()
      }
    });

    // Notify tutor via WebSocket
    if (socketService) {
      socketService.sendToUser(session.tutoId, 'session_accepted', {
        sessionId,
        message: 'The student has accepted the session! You can now start the session.'
      });
      
      // Also notify about session status change
      socketService.notifySessionStatusChanged({
        sessionId,
        status: SessionStatus.ACCEPTED,
        session: {
          id: sessionId,
          status: SessionStatus.ACCEPTED,
          tutoId: session.tutoId,
          rookieId: session.rookieId,
          startTime: session.startTime,
          notes: session.notes
        }
      });
    }

    res.json({
      success: true,
      message: 'Session accepted successfully!'
    });

  } catch (error) {
    console.error('Error accepting session:', error);
    res.status(500).json({
      error: 'Failed to accept session'
    });
  }
};

// Start session as Rookie (Rookie starts an accepted session)
export const startSessionAsRookie = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is the rookie for this session
    if (session.rookieId !== userId) {
      return res.status(403).json({
        error: 'Only the rookie can start this session'
      });
    }

    // Check if session is in ACCEPTED status
    if (session.status !== SessionStatus.ACCEPTED) {
      return res.status(400).json({
        error: 'Session is not ready to start. Status: ' + session.status
      });
    }

    if (!session.tutoId) {
      return res.status(400).json({
        error: 'No tutor assigned to this session'
      });
    }

    // Update session status to IN_PROGRESS
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        rookieJoinedAt: new Date(),
        startTime: new Date()
      },
      include: {
        tuto: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        rookie: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true
          }
        }
      }
    });

    // Notify tutor via WebSocket
    if (socketService) {
      socketService.sendToUser(session.tutoId, 'session_started', {
        sessionId,
        message: 'The student has started the session!'
      });
      
      // Also notify about session status change to IN_PROGRESS
      socketService.notifySessionStatusChanged({
        sessionId,
        status: SessionStatus.IN_PROGRESS,
        session: updatedSession
      });
    }

    res.json({
      success: true,
      message: 'Session started successfully!'
    });

  } catch (error) {
    console.error('Error starting session as rookie:', error);
    res.status(500).json({
      error: 'Failed to start session'
    });
  }
};

// Hide feedback from user's feed (doesn't affect rating calculation)
export const hideSessionFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        tutoId: true,
        rookieId: true,
        status: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.tutoId !== userId && session.rookieId !== userId) {
      return res.status(403).json({
        error: 'You can only hide feedback for sessions you participated in'
      });
    }

    // Check if session is completed
    if (session.status !== SessionStatus.COMPLETED) {
      return res.status(400).json({
        error: 'Can only hide feedback for completed sessions'
      });
    }

    // Update the session to mark the feedback as hidden by this user
    const updateData: any = {};
    
    // Determine which feedback to hide based on user role
    if (session.tutoId === userId) {
      // Tuto is hiding rookie feedback
      updateData.rookieFeedbackHiddenBy = userId;
    } else if (session.rookieId === userId) {
      // Rookie is hiding tuto feedback
      updateData.tutoFeedbackHiddenBy = userId;
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: updateData
    });

    res.json({
      message: 'Feedback hidden successfully',
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Error hiding session feedback:', error);
    res.status(500).json({
      error: 'Failed to hide feedback'
    });
  }
};