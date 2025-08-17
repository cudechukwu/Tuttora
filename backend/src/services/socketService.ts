import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { SessionService } from './sessionService';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "http://localhost:3004",
          "http://localhost:3005"
        ],
        credentials: true
      }
    });

    this.setupEventHandlers();
  }

  private setupForumEvents(socket: AuthenticatedSocket) {
    // Join forum room with university validation
    socket.on('joinForum', async (data: { universityId: string }) => {
      try {
        // Validate user authentication
        if (!socket.user) {
          socket.emit('forumError', { message: 'Not authenticated' });
          return;
        }

        // Handle default forum room
        if (data.universityId === 'default-forum') {
          socket.join('forum-default-forum');
          socket.join('forum-global');
          
          socket.emit('forumJoined', { 
            universityId: data.universityId,
            timestamp: Date.now()
          });

          console.log(`[FORUM] User ${socket.user.id} joined default forum room`);
          return;
        }

        // Verify university membership for specific universities
        const user = await prisma.user.findUnique({
          where: { id: socket.user.id },
          include: { university: true }
        });

        if (!user || user.universityId !== data.universityId) {
          socket.emit('forumError', { message: 'Unauthorized to join this forum' });
          return;
        }

        // Join rooms with validation
        socket.join(`forum-${data.universityId}`);
        socket.join('forum-global');
        
        socket.emit('forumJoined', { 
          universityId: data.universityId,
          timestamp: Date.now()
        });

        console.log(`[FORUM] User ${socket.user.id} joined forum for university ${data.universityId}`);

      } catch (error) {
        console.error('[FORUM] Forum join error:', error);
        socket.emit('forumError', { message: 'Failed to join forum' });
      }
    });

    // Leave forum room
    socket.on('leaveForum', (data: { universityId: string }) => {
      socket.leave(`forum-${data.universityId}`);
      socket.leave('forum-global');
      console.log(`[FORUM] User ${socket.user?.id} left forum for university ${data.universityId}`);
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`[SOCKET] New connection: id=${socket.id}, handshake.auth.token=${socket.handshake.auth && socket.handshake.auth.token ? '[REDACTED]' : 'none'}`);
      let authTimeout: NodeJS.Timeout | null = null;
      let authenticated = false;

      // Helper: authenticate socket
      const authenticateSocket = async (token: string) => {
        console.log(`[SOCKET] Token received for socket ${socket.id}: ${token ? '[REDACTED]' : 'none'}`);
        if (socket.user) return; // Prevent re-auth
        try {
          const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
          console.log(`[SOCKET] JWT payload decoded for socket ${socket.id}: userId=${payload.userId}`);
          
          if (!payload.userId) {
            console.error(`[SOCKET] Auth failed: No userId in JWT payload on socket ${socket.id}`);
            socket.emit('authStatus', { success: false, error: 'Invalid token payload' });
            socket.disconnect();
            return;
          }

          const user = await prisma.user.findUnique({ 
            where: { id: payload.userId } 
          });
          
          if (user) {
            socket.user = {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            };
            socket.userId = user.id; // Also set userId for compatibility
            authenticated = true;
            socket.emit('authStatus', { success: true, user: socket.user });
            console.log(`[SOCKET] Auth success for user ${user.id} (${user.username}) on socket ${socket.id}`);
            return;
          } else {
            console.error(`[SOCKET] Auth failed: User not found for userId=${payload.userId} on socket ${socket.id}`);
            socket.emit('authStatus', { success: false, error: 'User not found' });
            socket.disconnect();
          }
        } catch (err: any) {
          console.error(`[SOCKET] Auth failed: ${err.message} on socket ${socket.id}`);
          socket.emit('authStatus', { success: false, error: 'Invalid token' });
          socket.disconnect();
        }
      };

      // Support handshake.auth.token (modern Socket.IO) - this is the primary auth method
      const handshakeToken = socket.handshake.auth && socket.handshake.auth.token;
      if (handshakeToken) {
        console.log(`[SOCKET] handshake.auth.token present on connect for socket ${socket.id}`);
        authenticateSocket(handshakeToken);
      }

      // Listen for authenticate event (fallback for older clients)
      socket.on('authenticate', (token: string) => {
        console.log(`[SOCKET] 'authenticate' event received on socket ${socket.id}`);
        // Only authenticate if not already authenticated via handshake
        if (!socket.user) {
          authenticateSocket(token);
        } else {
          console.log(`[SOCKET] Socket ${socket.id} already authenticated, ignoring duplicate authenticate event`);
        }
      });

      // Disconnect if not authenticated after 5s
      authTimeout = setTimeout(() => {
        if (!authenticated) {
          socket.emit('authStatus', { success: false, error: 'Auth timeout' });
          console.warn(`[SOCKET] Auth timeout for socket ${socket.id}`);
          socket.disconnect();
        }
      }, 5000);

      // Handle room joining
      socket.on('joinRoom', async (data: { room: string }) => {
        try {
          const { room } = data;
          socket.join(room);
          console.log(`User joined room: ${room}`);
        } catch (error) {
          console.error('Error joining room:', error);
        }
      });

      // Handle room leaving
      socket.on('leaveRoom', async (data: { room: string }) => {
        try {
          const { room } = data;
          socket.leave(room);
          console.log(`User left room: ${room}`);
        } catch (error) {
          console.error('Error leaving room:', error);
        }
      });

      // Forum-specific event handlers
      this.setupForumEvents(socket);

      // Handle session chat messages
      socket.on('sendMessage', async (data: { sessionId: string; content: string; type?: string }) => {
        try {
          const { sessionId, content, type = 'text' } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            socket.emit('messageError', { error: 'User not authenticated' });
            return;
          }
          
          // Validate the message
          if (!content || content.trim().length === 0) {
            socket.emit('messageError', { error: 'Message content is required' });
            return;
          }

          // Save message to database
          const savedMessage = await SessionService.saveMessage(sessionId, socket.user.id, content.trim(), type);

          // Create message data with real user info
          const messageData = {
            id: savedMessage.id,
            content: savedMessage.content,
            type: savedMessage.type,
            timestamp: savedMessage.timestamp,
            sessionId: savedMessage.sessionId,
            sender: {
              id: socket.user.id,
              name: `${socket.user.firstName} ${socket.user.lastName}`,
              role: socket.user.role,
              avatar: savedMessage.sender.role === 'TUTO' 
                ? savedMessage.sender.tutoProfile?.selectedAvatar 
                : savedMessage.sender.rookieProfile?.selectedAvatar
            }
          };

          // Broadcast to session room
          this.sendToRoom(`session-${sessionId}`, 'newMessage', messageData);
          
          console.log(`Message sent to session ${sessionId} by ${socket.user.username}:`, content);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('messageError', { error: 'Failed to send message' });
        }
      });

      // Handle collaborative whiteboard events
      socket.on('whiteboardStroke', (data: { stroke: any; pageIndex: number; sessionId: string }) => {
        try {
          const { stroke, pageIndex, sessionId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to send whiteboard stroke');
            return;
          }

          // Broadcast stroke to other users in the whiteboard room
          this.sendToRoom(`whiteboard-${sessionId}`, 'whiteboardStroke', { stroke, pageIndex });
          console.log(`Whiteboard stroke broadcasted to session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling whiteboard stroke:', error);
        }
      });

      socket.on('whiteboardText', (data: { text: any; pageIndex: number; sessionId: string }) => {
        try {
          const { text, pageIndex, sessionId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to send whiteboard text');
            return;
          }

          // Broadcast text to other users in the whiteboard room
          this.sendToRoom(`whiteboard-${sessionId}`, 'whiteboardText', { text, pageIndex });
          console.log(`Whiteboard text broadcasted to session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling whiteboard text:', error);
        }
      });

      socket.on('whiteboardPageChange', (data: { pageIndex: number; sessionId: string }) => {
        try {
          const { pageIndex, sessionId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to change whiteboard page');
            return;
          }

          // Broadcast page change to other users in the whiteboard room
          this.sendToRoom(`whiteboard-${sessionId}`, 'whiteboardPageChange', { pageIndex });
          console.log(`Whiteboard page change broadcasted to session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling whiteboard page change:', error);
        }
      });

      socket.on('whiteboardClear', (data: { pageIndex: number; sessionId: string }) => {
        try {
          const { pageIndex, sessionId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to clear whiteboard');
            return;
          }

          // Broadcast clear event to other users in the whiteboard room
          this.sendToRoom(`whiteboard-${sessionId}`, 'whiteboardClear', { pageIndex });
          console.log(`Whiteboard clear broadcasted to session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling whiteboard clear:', error);
        }
      });

      // Handle collaborative code editor events
      socket.on('codeChange', (data: { sessionId: string; code: string; language: string; userId: string }) => {
        try {
          const { sessionId, code, language, userId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to send code change');
            return;
          }

          // Broadcast code change to other users in the session room
          this.sendToRoom(`session-${sessionId}`, 'codeChange', { 
            code, 
            language, 
            userId: socket.user.id,
            username: socket.user.username,
            timestamp: Date.now()
          });
          console.log(`Code change broadcasted to session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling code change:', error);
        }
      });

      // Handle screen sharing events
      socket.on('screenShareStarted', (data: { sessionId: string; title: string }) => {
        try {
          const { sessionId, title } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to start screen share');
            return;
          }

          // Broadcast screen share started to session room
          this.sendToRoom(`session-${sessionId}`, 'screenShareStarted', {
            sharerId: socket.user.id,
            sharerName: `${socket.user.firstName} ${socket.user.lastName}`,
            sharerRole: socket.user.role,
            title: title || `${socket.user.firstName}'s Screen`,
            timestamp: Date.now()
          });
          console.log(`Screen share started in session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling screen share started:', error);
        }
      });

      socket.on('screenShareStopped', (data: { sessionId: string; shareId: string }) => {
        try {
          const { sessionId, shareId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to stop screen share');
            return;
          }

          // Broadcast screen share stopped to session room
          this.sendToRoom(`session-${sessionId}`, 'screenShareStopped', {
            shareId,
            sharerId: socket.user.id,
            sharerName: `${socket.user.firstName} ${socket.user.lastName}`,
            timestamp: Date.now()
          });
          console.log(`Screen share stopped in session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling screen share stopped:', error);
        }
      });

      socket.on('screenShareViewerJoined', (data: { sessionId: string; shareId: string }) => {
        try {
          const { sessionId, shareId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to join screen share');
            return;
          }

          // Broadcast viewer joined to session room
          this.sendToRoom(`session-${sessionId}`, 'screenShareViewerJoined', {
            shareId,
            viewerId: socket.user.id,
            viewerName: `${socket.user.firstName} ${socket.user.lastName}`,
            viewerRole: socket.user.role,
            timestamp: Date.now()
          });
          console.log(`Screen share viewer joined in session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling screen share viewer joined:', error);
        }
      });

      socket.on('screenShareViewerLeft', (data: { sessionId: string; shareId: string }) => {
        try {
          const { sessionId, shareId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to leave screen share');
            return;
          }

          // Broadcast viewer left to session room
          this.sendToRoom(`session-${sessionId}`, 'screenShareViewerLeft', {
            shareId,
            viewerId: socket.user.id,
            viewerName: `${socket.user.firstName} ${socket.user.lastName}`,
            timestamp: Date.now()
          });
          console.log(`Screen share viewer left in session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling screen share viewer left:', error);
        }
      });

      // Handle WebRTC signaling
      socket.on('webrtc-signal', (message: any) => {
        try {
          const { sessionId, shareId, type, data, to } = message;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to send WebRTC signal');
            return;
          }

          console.log(`📡 WebRTC signal from ${socket.user.username}: ${type} for share ${shareId} in session ${sessionId}`);

          // Forward the signal to other participants in the session
          this.sendToRoom(`session-${sessionId}`, 'webrtc-signal', {
            type,
            data,
            shareId,
            from: socket.user.id,
            fromName: `${socket.user.firstName} ${socket.user.lastName}`,
            timestamp: Date.now()
          });
          
          console.log(`✅ WebRTC signal forwarded to session ${sessionId}`);
        } catch (error) {
          console.error('❌ Error handling WebRTC signal:', error);
        }
      });

      socket.on('languageChange', (data: { sessionId: string; language: string }) => {
        try {
          const { sessionId, language } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to change language');
            return;
          }

          // Broadcast language change to other users in the session room
          this.sendToRoom(`session-${sessionId}`, 'languageChange', { 
            language,
            userId: socket.user.id,
            username: socket.user.username,
            timestamp: Date.now()
          });
          console.log(`Language change broadcasted to session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling language change:', error);
        }
      });

      socket.on('codeExecution', (data: { sessionId: string; code: string; language: string; output: string }) => {
        try {
          const { sessionId, code, language, output } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to execute code');
            return;
          }

          // Broadcast code execution result to other users in the session room
          this.sendToRoom(`session-${sessionId}`, 'codeExecution', { 
            code,
            language,
            output,
            userId: socket.user.id,
            username: socket.user.username,
            timestamp: Date.now()
          });
          console.log(`Code execution broadcasted to session ${sessionId} by ${socket.user.username}`);
        } catch (error) {
          console.error('Error handling code execution:', error);
        }
      });

      socket.on('joinCodeRoom', (data: { sessionId: string }) => {
        try {
          const { sessionId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to join code room');
            return;
          }

          // Join the session room for code collaboration
          socket.join(`session-${sessionId}`);
          console.log(`User ${socket.user.username} joined code room for session ${sessionId}`);
          
          // Notify other users in the room
          socket.to(`session-${sessionId}`).emit('userJoinedCodeRoom', {
            userId: socket.user.id,
            username: socket.user.username,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error handling join code room:', error);
        }
      });

      socket.on('leaveCodeRoom', (data: { sessionId: string }) => {
        try {
          const { sessionId } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            console.warn('Unauthenticated user tried to leave code room');
            return;
          }

          // Leave the session room
          socket.leave(`session-${sessionId}`);
          console.log(`User ${socket.user.username} left code room for session ${sessionId}`);
          
          // Notify other users in the room
          socket.to(`session-${sessionId}`).emit('userLeftCodeRoom', {
            userId: socket.user.id,
            username: socket.user.username,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error handling leave code room:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing', async (data: { sessionId: string; isTyping: boolean }) => {
        try {
          const { sessionId, isTyping } = data;
          
          // Check if user is authenticated
          if (!socket.user) {
            return; // Silently ignore if not authenticated
          }
          
          // Broadcast typing indicator to session room (excluding sender)
          socket.to(`session-${sessionId}`).emit('userTyping', {
            sessionId,
            userId: socket.user.id,
            username: socket.user.username,
            isTyping
          });
        } catch (error) {
          console.error('Error handling typing indicator:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`[SOCKET] Socket disconnected: id=${socket.id}, reason=${reason}`);
      });
    });
  }

  // Public methods for external use
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public sendToUser(userId: string, event: string, data: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  public sendToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  // New methods for session real-time updates
  public notifyNewSessionRequest(requestData: any) {
    // Notify both tutos and the rookie who created the request
    this.sendToRoom('tutos', 'newSessionRequest', requestData);
    this.sendToRoom('rookies', 'newSessionRequest', requestData);
  }

  public notifySessionRequestRejected(requestData: any) {
    this.sendToRoom('tutos', 'sessionRequestRejected', requestData);
  }

  public notifySessionRequestAccepted(requestId: string) {
    // Notify both tutos and rookies about accepted requests
    this.sendToRoom('tutos', 'sessionRequestAccepted', { requestId });
    this.sendToRoom('rookies', 'sessionRequestAccepted', { requestId });
  }

  public notifySessionStarted(data: any) {
    const { sessionId, session } = data;
    const roomName = `session-${sessionId}`;
    
    // Notify both users in the session room
    this.sendToRoom(roomName, 'sessionStarted', {
      sessionId,
      session,
      timestamp: new Date()
    });

    // Also notify in both tuto and rookie rooms for dashboard updates
    this.sendToRoom('tutos', 'sessionStarted', {
      sessionId,
      session,
      timestamp: new Date()
    });
    this.sendToRoom('rookies', 'sessionStarted', {
      sessionId,
      session,
      timestamp: new Date()
    });
  }

  public notifySessionStatusChanged(data: any) {
    const { sessionId, status, session } = data;
    const roomName = `session-${sessionId}`;
    
    // Notify users in the session room
    this.sendToRoom(roomName, 'sessionStatusChanged', {
      sessionId,
      status,
      session,
      timestamp: new Date()
    });

    // Notify in both tuto and rookie rooms for dashboard updates
    this.sendToRoom('tutos', 'sessionStatusChanged', {
      sessionId,
      status,
      session,
      timestamp: new Date()
    });
    this.sendToRoom('rookies', 'sessionStatusChanged', {
      sessionId,
      status,
      session,
      timestamp: new Date()
    });
  }

  public notifyGracePeriodExpired(data: any) {
    const { sessionId, session } = data;
    const roomName = `session-${sessionId}`;
    
    // Notify users in the session room
    this.sendToRoom(roomName, 'gracePeriodExpired', {
      sessionId,
      session,
      timestamp: new Date()
    });

    // Notify in both tuto and rookie rooms for dashboard updates
    this.sendToRoom('tutos', 'gracePeriodExpired', {
      sessionId,
      session,
      timestamp: new Date()
    });
    this.sendToRoom('rookies', 'gracePeriodExpired', {
      sessionId,
      session,
      timestamp: new Date()
    });
  }

  // New method for broadcasting session messages
  public broadcastSessionMessage(sessionId: string, message: any) {
    this.sendToRoom(`session-${sessionId}`, 'newMessage', message);
  }

  public notifyFileUploaded(sessionId: string, file: any) {
    this.sendToRoom(`session-${sessionId}`, 'fileUploaded', file);
  }

  public notifyFileDeleted(sessionId: string, fileId: string) {
    this.sendToRoom(`session-${sessionId}`, 'fileDeleted', { fileId });
  }

  // Forum-specific broadcast methods
  public broadcastNewPost(post: any, universityId: string, excludeUserId?: string) {
    const postData = {
      ...post,
      timestamp: Date.now(),
      isOptimistic: false
    };

    console.log(`[FORUM] Broadcasting post ${post.id} to university ${universityId}`);
    console.log(`[FORUM] Room forum-${universityId} has ${this.io.sockets.adapter.rooms.get(`forum-${universityId}`)?.size || 0} connected users`);
    console.log(`[FORUM] Room forum-global has ${this.io.sockets.adapter.rooms.get('forum-global')?.size || 0} connected users`);

    // Broadcast to university-specific forum room
    this.sendToRoom(`forum-${universityId}`, 'newForumPost', postData);
    
    // Also broadcast to global forum room for cross-university visibility
    this.sendToRoom('forum-global', 'newForumPost', postData);
    
    // If this is a real university post, also broadcast to default forum room
    if (universityId !== 'default-forum') {
      this.sendToRoom('forum-default-forum', 'newForumPost', postData);
    }
    
    console.log(`[FORUM] New post broadcasted to forum-${universityId} and forum-global`);
  }

  public broadcastPostUpdate(postId: string, action: 'updated' | 'deleted', universityId: string) {
    const updateData = {
      postId,
      action,
      timestamp: Date.now()
    };

    this.sendToRoom(`forum-${universityId}`, 'forumPostUpdated', updateData);
    this.sendToRoom('forum-global', 'forumPostUpdated', updateData);
    
    console.log(`[FORUM] Post ${action} broadcasted for post ${postId}`);
  }

  public broadcastNewComment(comment: any, universityId: string) {
    const commentData = {
      ...comment,
      timestamp: Date.now()
    };

    this.sendToRoom(`forum-${universityId}`, 'newForumComment', commentData);
    this.sendToRoom('forum-global', 'newForumComment', commentData);
    
    console.log(`[FORUM] New comment broadcasted for post ${comment.postId}`);
  }

  public broadcastVoteUpdate(postId: string, voteData: any, universityId: string) {
    const voteUpdateData = {
      postId,
      voteData,
      timestamp: Date.now()
    };

    this.sendToRoom(`forum-${universityId}`, 'forumVoteUpdated', voteUpdateData);
    this.sendToRoom('forum-global', 'forumVoteUpdated', voteUpdateData);
    
    console.log(`[FORUM] Vote update broadcasted for post ${postId}`);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketService; 