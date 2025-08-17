import axios from 'axios';

interface DailyRoom {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
  };
}

interface CreateRoomRequest {
  name?: string;
  privacy?: 'private' | 'public';
  properties?: {
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    enable_knocking?: boolean;
    enable_recording?: boolean;
    enable_people_ui?: boolean;
    enable_video_processing_ui?: boolean;
    exp?: number; // Room expiration time (Unix timestamp)
  };
}

export class DailyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || '';
    this.baseUrl = process.env.DAILY_API_BASE_URL || 'https://api.daily.co/v1';
    
    if (!this.apiKey) {
      console.warn('Daily.co API key not found. Video calling will not work.');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Create a new Daily.co room for a session
  async createRoom(sessionId: string, options: CreateRoomRequest = {}): Promise<DailyRoom> {
    try {
      const roomName = `session-${sessionId}`;
      
      // Set default properties for tutoring sessions
      const defaultProperties = {
        max_participants: 2, // Only Tuto and Rookie
        enable_chat: false, // We'll use our own chat
        enable_screenshare: true,
        exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // Expire in 2 hours
      };

      const roomConfig: CreateRoomRequest = {
        name: roomName,
        privacy: 'public', // Temporarily public for testing
        properties: {
          ...defaultProperties,
          ...options.properties,
          // Additional permissive settings
          enable_knocking: false,
          enable_recording: false,
          enable_people_ui: false,
          enable_video_processing_ui: false,
          enable_chat: false,
          enable_screenshare: true,
          max_participants: 2,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours instead of 2
        }
      };

      console.log('Creating Daily.co room with config:', JSON.stringify(roomConfig, null, 2));
      
      const response = await axios.post(
        `${this.baseUrl}/rooms`,
        roomConfig,
        { headers: this.getHeaders() }
      );

      console.log(`Daily.co room created: ${response.data.url} for session: ${sessionId}`);
      console.log('Room details:', JSON.stringify(response.data, null, 2));
      return response.data;

    } catch (error: any) {
      console.error('Error creating Daily.co room:', error.response?.data || error.message);
      throw new Error(`Failed to create video room: ${error.response?.data?.error || error.message}`);
    }
  }

  // Generate a meeting token for a user to join a private room
  async generateMeetingToken(roomName: string, userName: string, userId: string): Promise<string> {
    try {
      const tokenConfig = {
        room: roomName,
        properties: {
          user_name: userName,
          user_id: userId,
          exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // Token expires in 2 hours
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/meeting-tokens`,
        tokenConfig,
        { headers: this.getHeaders() }
      );

      console.log(`Daily.co meeting token generated for user ${userName} in room ${roomName}`);
      return response.data.token;

    } catch (error: any) {
      console.error('Error generating Daily.co meeting token:', error.response?.data || error.message);
      throw new Error(`Failed to generate meeting token: ${error.response?.data?.error || error.message}`);
    }
  }

  // Get room information
  async getRoom(roomName: string): Promise<DailyRoom> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/rooms/${roomName}`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error getting Daily.co room:', error.response?.data || error.message);
      throw new Error(`Failed to get room info: ${error.response?.data?.error || error.message}`);
    }
  }

  // Delete a room when session ends
  async deleteRoom(roomName: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/rooms/${roomName}`,
        { headers: this.getHeaders() }
      );
      
      console.log(`Daily.co room deleted: ${roomName}`);
    } catch (error: any) {
      console.error('Error deleting Daily.co room:', error.response?.data || error.message);
      // Don't throw error for deletion failures - log and continue
    }
  }

  // Get room URL for frontend
  getRoomUrl(roomName: string): string {
    return `https://${process.env.DAILY_DOMAIN || 'tuttopassa'}.daily.co/${roomName}`;
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/rooms`,
        { 
          headers: this.getHeaders(),
          params: { limit: 1 }
        }
      );
      
      console.log('Daily.co API connection successful');
      return true;
    } catch (error: any) {
      console.error('Daily.co API connection failed:', error.response?.data || error.message);
      return false;
    }
  }
}

// Export singleton instance
export const dailyService = new DailyService(); 