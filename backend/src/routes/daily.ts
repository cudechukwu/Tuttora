import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { dailyService } from '../services/dailyService';

const router = Router();

// Test Daily.co API connection
router.get('/test-connection', async (req, res) => {
  try {
    const isConnected = await dailyService.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? 'Daily.co API connection successful' : 'Daily.co API connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing Daily.co connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Daily.co connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test room creation (for development testing)
router.post('/test-room', authenticateToken, async (req, res) => {
  try {
    const testSessionId = `test-${Date.now()}`;
    
    const room = await dailyService.createRoom(testSessionId);
    
    res.json({
      success: true,
      message: 'Test room created successfully',
      room: {
        name: room.name,
        url: room.url,
        sessionId: testSessionId
      }
    });
  } catch (error) {
    console.error('Error creating test room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test room',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clean up test rooms (for development)
router.delete('/test-room/:roomName', authenticateToken, async (req, res) => {
  try {
    const { roomName } = req.params;
    
    await dailyService.deleteRoom(roomName);
    
    res.json({
      success: true,
      message: `Test room ${roomName} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting test room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete test room',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manually create room for specific session (for debugging)
router.post('/create-room/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // First, try to delete existing room if it exists
    try {
      await dailyService.deleteRoom(`session-${sessionId}`);
      console.log(`Deleted existing room for session ${sessionId}`);
    } catch (error) {
      console.log(`No existing room to delete for session ${sessionId}`);
    }
    
    // Create new room
    const room = await dailyService.createRoom(sessionId);
    
    res.json({
      success: true,
      message: 'Room created successfully',
      room: {
        name: room.name,
        url: room.url,
        sessionId: sessionId
      }
    });
  } catch (error) {
    console.error('Error creating room for session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room for session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 