import express = require('express');
import cors = require('cors');
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv = require('dotenv');
import { createServer } from 'http';
import { Server } from 'socket.io';
import bodyParser = require('body-parser');
import SocketService from './services/socketService';
import { startGracePeriodService, setGracePeriodSocketService } from './services/gracePeriodService';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import universityRoutes from './routes/universities';
import courseRoutes from './routes/courses';
import sessionRoutes from './routes/sessions';
import chatRoutes from './routes/chat';
import profileRoutes from './routes/profile';
import dashboardRoutes from './routes/dashboard';
import dailyRoutes from './routes/daily';
import aiRoutes from './routes/ai';
import screenShareRoutes from './routes/screenShare';
import fileRoutes from './routes/files';
import academicRoutes from './routes/academic';
import forumRoutes from './routes/forum';
import fileUploadRoutes from './routes/fileUpload';
import avatarRoutes from './routes/avatars';


// Import session controller to set up socket service
import { setSocketService } from './controllers/sessions';
import { setScreenShareSocketService } from './controllers/screenShare';
import { setSocketService as setFileSocketService } from './controllers/files';

// Import middleware
import errorHandler from './middleware/errorHandler';
import notFound from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();

const server = createServer(app);

// Initialize WebSocket service
const socketService = new SocketService(server);

// Initialize Grace Period service
setGracePeriodSocketService(socketService);
startGracePeriodService();

// Set up socket service in session controller for real-time updates
setSocketService(socketService);
setScreenShareSocketService(socketService);
setFileSocketService(socketService);

// Make socketService available to all controllers via app.locals
app.locals.socketService = socketService;

// Rate limiting - increased limits for real-time app
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for real-time features)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://tuttora.app",
    "https://www.tuttora.app",
    "https://tuttora-frontend.vercel.app",
    "https://tuttora-frontend-git-main-cudechukwu.vercel.app",
    "https://tuttora-production.up.railway.app",
    "http://localhost:3001",
    "http://localhost:3002", 
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005"
  ],
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
            message: 'Tuttora API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/screen-share', screenShareRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/files', fileUploadRoutes);
app.use('/api/avatars', avatarRoutes);


// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Tuttora API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server is ready for real-time communication`);
  
  // Grace period service already started
  
  // Auto-run seed if RUN_SEED environment variable is set
  if (process.env.RUN_SEED === 'true') {
    console.log('🌱 RUN_SEED detected - starting database seed...');
    import('./database/seed').then(async () => {
      try {
        // The seed file runs automatically when imported
        console.log('✅ Database seed completed successfully!');
        // Remove the environment variable after successful seed
        delete process.env.RUN_SEED;
      } catch (error) {
        console.error('❌ Database seed failed:', error);
      }
    }).catch((error) => {
      console.error('❌ Failed to import seed module:', error);
    });
  }
});

export { socketService }; 