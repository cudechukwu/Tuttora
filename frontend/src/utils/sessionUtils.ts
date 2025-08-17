// Define SessionRequest interface locally to avoid circular imports
interface SessionRequest {
  id: string;
  status: string;
  notes: string;
  urgency: string;
  createdAt: string;
  rookie: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
    department: string;
  };
}

export interface FormattedRequest {
  id: string;
  subject: string;
  topic: string;
  description: string;
  urgency: string;
  waitTime: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  priorityColor: string;
  urgencyColor: string;
  rookieName: string;
  matchLabel?: string;
  matchQuality?: number;
}

export interface FormattedActiveSession {
  id: string;
  subject: string;
  description: string;
  status: 'ACCEPTED' | 'IN_PROGRESS';
  rookieName: string;
  remainingTime: string;
  courseName?: string;
}

export function parseSessionNotes(notes: string): {
  subject: string;
  topic: string;
  description: string;
  urgency: string;
} {
  const parts = notes.split(' | ');
  const result = {
    subject: '',
    topic: '',
    description: '',
    urgency: 'Not urgent'
  };

  parts.forEach(part => {
    if (part.startsWith('Subject: ')) {
      result.subject = part.replace('Subject: ', '');
    } else if (part.startsWith('Topic: ')) {
      result.topic = part.replace('Topic: ', '');
    } else if (part.startsWith('Description: ')) {
      result.description = part.replace('Description: ', '');
    } else if (part.startsWith('Urgency: ')) {
      const urgency = part.replace('Urgency: ', '');
      // Convert to lowercase format
      if (urgency === 'Very Urgent') {
        result.urgency = 'Very urgent';
      } else if (urgency === 'Somewhat Urgent') {
        result.urgency = 'Somewhat urgent';
      } else {
        result.urgency = 'Not urgent';
      }
    }
  });

  return result;
}

export function getWaitTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
}

export function getPriority(urgency: string, waitTime: string): {
  priority: 'high' | 'medium' | 'low';
  priorityColor: string;
  urgencyColor: string;
} {
  const waitMinutes = parseInt(waitTime.replace(/\D/g, '')) || 0;
  
  // Match the exact static design colors
  if (urgency === 'Very Urgent' || waitMinutes > 20) {
    return {
      priority: 'high',
      priorityColor: 'from-red-50 to-orange-50 border-red-200',
      urgencyColor: 'bg-red-100 text-red-700'
    };
  } else if (urgency === 'Somewhat Urgent' || waitMinutes > 10) {
    return {
      priority: 'medium',
      priorityColor: 'from-orange-50 to-yellow-50 border-orange-200',
      urgencyColor: 'bg-yellow-100 text-yellow-700'
    };
  } else {
    return {
      priority: 'low',
      priorityColor: 'bg-white border-gray-200',
      urgencyColor: 'bg-gray-100 text-gray-700'
    };
  }
}

export function sortRequestsByPriority(requests: SessionRequest[]): SessionRequest[] {
  return [...requests].sort((a, b) => {
    const aParsed = parseSessionNotes(a.notes || '');
    const bParsed = parseSessionNotes(b.notes || '');
    
    // Primary sort: waiting time (oldest first)
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (aTime !== bTime) {
      return aTime - bTime;
    }
    
    // Secondary sort: urgency level
    const urgencyOrder = { 'Very Urgent': 3, 'Somewhat Urgent': 2, 'Not Urgent': 1 };
    const aUrgency = urgencyOrder[aParsed.urgency as keyof typeof urgencyOrder] || 1;
    const bUrgency = urgencyOrder[bParsed.urgency as keyof typeof urgencyOrder] || 1;
    
    return bUrgency - aUrgency;
  });
}

export function extractKeywords(description: string): string[] {
  // Simple keyword extraction - in a real app, you might use NLP
  const commonKeywords = [
    'derivatives', 'optimization', 'newton', 'forces', 'motion',
    'thesis', 'argument', 'structure', 'stoichiometry', 'moles',
    'supply', 'demand', 'elasticity', 'calculus', 'physics',
    'chemistry', 'economics', 'writing', 'essay', 'lab'
  ];
  
  const lowerDesc = description.toLowerCase();
  return commonKeywords.filter(keyword => lowerDesc.includes(keyword)).slice(0, 3);
}

export function formatSessionRequest(request: SessionRequest): FormattedRequest {
  const { subject, topic, description, urgency } = parseSessionNotes(request.notes || '');
  const waitTime = getWaitTime(request.createdAt);
  const { priority, priorityColor, urgencyColor } = getPriority(urgency, waitTime);
  const keywords = extractKeywords(description);
  
  const rookieName = request.rookie 
    ? `${request.rookie.firstName} ${request.rookie.lastName.charAt(0)}.`
    : 'Anonymous';

  return {
    id: request.id,
    subject: subject || 'General Help',
    topic: topic || 'Various topics',
    description: description || 'Help needed with coursework',
    urgency,
    waitTime,
    keywords,
    priority,
    priorityColor,
    urgencyColor,
    rookieName,
    matchLabel: (request as any).matchLabel,
    matchQuality: (request as any).matchQuality
  };
} 

export const formatActiveSession = (session: any): FormattedActiveSession => {
  // Extract subject and description from notes
  const notes = session.notes || '';
  const subjectMatch = notes.match(/Subject: ([^|]+)/);
  const topicMatch = notes.match(/Topic: ([^|]+)/);
  const descriptionMatch = notes.match(/Description: ([^|]+)/);
  
  const subject = subjectMatch ? subjectMatch[1].trim() : (session.course?.name || 'General Help');
  const topic = topicMatch ? topicMatch[1].trim() : '';
  const description = descriptionMatch ? descriptionMatch[1].trim() : (topic || 'No specific topic');
  
  // Format rookie name
  const rookieName = `${session.rookie.firstName} ${session.rookie.lastName.charAt(0)}.`;
  
  // Calculate remaining time (assuming 60-minute sessions)
  const sessionDuration = 60; // minutes
  const startTime = new Date(session.startTime);
  const now = new Date();
  const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  const remainingMinutes = Math.max(0, sessionDuration - elapsedMinutes);
  
  const remainingTime = formatRemainingTime(remainingMinutes);
  
  return {
    id: session.id,
    subject,
    description,
    status: session.status,
    rookieName,
    remainingTime,
    courseName: session.course?.name
  };
};

export const formatRemainingTime = (minutes: number): string => {
  if (minutes <= 0) {
    return 'Session ended';
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m remaining`;
  } else {
    return `${remainingMinutes}m remaining`;
  }
}; 