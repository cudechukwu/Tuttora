import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get user's chat conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Get all conversations where user is either sender or receiver
    const conversations = await prisma.message.groupBy({
      by: ['senderId', 'receiverId'],
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      _count: {
        id: true
      },
      _max: {
        timestamp: true
      }
    });

    // Get unique conversation partners
    const conversationPartners = new Set<string>();
    conversations.forEach((conv: any) => {
      if (conv.senderId === userId) {
        conversationPartners.add(conv.receiverId);
      } else {
        conversationPartners.add(conv.senderId);
      }
    });

    // Get user details for each conversation partner
    const conversationUsers = await prisma.user.findMany({
      where: {
        id: { in: Array.from(conversationPartners) }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isOnline: true,
        isAvailable: true,
        lastSeen: true
      }
    });

    // Get last message for each conversation
    const conversationList = await Promise.all(
      conversationUsers.map(async (user) => {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: user.id },
              { senderId: user.id, receiverId: userId }
            ]
          },
          orderBy: { timestamp: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: user.id,
            receiverId: userId,
            read: false
          }
        });

        return {
          user,
          lastMessage,
          unreadCount
        };
      })
    );

    // Sort by last message timestamp
    conversationList.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });

    res.json(conversationList);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages between two users
router.get('/messages/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const otherUserId = req.params.otherUserId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false
      },
      data: { read: true }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get available tutors for chat
router.get('/available-tutors', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { courseId } = req.query;

    let whereClause: any = {
      role: { in: ['TUTO', 'BOTH'] },
      isAvailable: true,
      id: { not: userId }
    };

    // If courseId is provided, filter by course
    if (courseId) {
      whereClause.userCourses = {
        some: {
          courseId: courseId as string
        }
      };
    }

    const tutors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isOnline: true,
        isAvailable: true,
        lastSeen: true,
        university: {
          select: {
            id: true,
            name: true
          }
        },
        userCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true
              }
            }
          }
        }
      }
    });

    res.json(tutors);
  } catch (error) {
    console.error('Error fetching available tutors:', error);
    res.status(500).json({ error: 'Failed to fetch available tutors' });
  }
});

// Start a new conversation
router.post('/start-conversation', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { receiverId, initialMessage } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    // Check if receiver exists and is available
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        isAvailable: true,
        role: true
      }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    if (!receiver.isAvailable) {
      return res.status(400).json({ error: 'Receiver is not available' });
    }

    let message = null;

    // If initial message is provided, create it
    if (initialMessage) {
      message = await prisma.message.create({
        data: {
          senderId: userId,
          receiverId,
          content: initialMessage,
          type: 'text',
          timestamp: new Date()
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    }

    res.json({
      conversationId: `${userId}-${receiverId}`,
      receiver,
      initialMessage: message
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Mark messages as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { senderId } = req.body;

    await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: userId,
        read: false
      },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get session messages
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const sessionId = req.params.sessionId;

    // Verify user has access to this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        rookieId: true,
        tutoId: true,
        status: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.rookieId !== userId && session.tutoId !== userId) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Get messages for this session
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            tutoProfile: {
              select: {
                selectedAvatar: true
              }
            },
            rookieProfile: {
              select: {
                selectedAvatar: true
              }
            }
          }
        }
      }
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching session messages:', error);
    res.status(500).json({ error: 'Failed to fetch session messages' });
  }
});

// Send message to session
router.post('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const sessionId = req.params.sessionId;
    const { content, type = 'text' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user has access to this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        rookieId: true,
        tutoId: true,
        status: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.rookieId !== userId && session.tutoId !== userId) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type,
        senderId: userId,
        sessionId,
        timestamp: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            tutoProfile: {
              select: {
                selectedAvatar: true
              }
            },
            rookieProfile: {
              select: {
                selectedAvatar: true
              }
            }
          }
        }
      }
    });

    res.json({ message });
  } catch (error) {
    console.error('Error sending session message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Like/unlike a message
router.post('/session/:sessionId/messages/:messageId/like', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const sessionId = req.params.sessionId;
    const messageId = req.params.messageId;

    // Verify user has access to this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        rookieId: true,
        tutoId: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.rookieId !== userId && session.tutoId !== userId) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // For now, we'll just return success since the Message model doesn't have likes field
    // In a future update, we could add a MessageLike model or likes field to Message
    res.json({ success: true, message: 'Like functionality coming soon' });
  } catch (error) {
    console.error('Error liking message:', error);
    res.status(500).json({ error: 'Failed to like message' });
  }
});

export default router; 