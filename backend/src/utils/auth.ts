import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

export const generateTokens = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { userId }, 
    jwtSecret as jwt.Secret, 
    { expiresIn: '15m' } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    { userId }, 
    jwtRefreshSecret as jwt.Secret, 
    { expiresIn: '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyToken = async (token: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret as jwt.Secret) as any;
    return { id: decoded.userId };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateUsername = (): string => {
  const adjectives = ['Swift', 'Bright', 'Clever', 'Wise', 'Quick', 'Smart', 'Sharp', 'Bright', 'Calm', 'Cool'];
  const nouns = ['Student', 'Learner', 'Scholar', 'Thinker', 'Explorer', 'Creator', 'Builder', 'Dreamer', 'Visionary', 'Innovator'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  
  return `${adjective}${noun}${number}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 