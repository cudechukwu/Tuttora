import { WebRTCService } from './webrtcService';

export class ScreenShareService {
  private webrtcService: WebRTCService | null = null;
  private localStream: MediaStream | null = null;
  private onStreamReceived: ((stream: MediaStream) => void) | null = null;

  constructor() {
    this.startScreenShare = this.startScreenShare.bind(this);
    this.stopScreenShare = this.stopScreenShare.bind(this);
    this.joinScreenShare = this.joinScreenShare.bind(this);
    this.leaveScreenShare = this.leaveScreenShare.bind(this);
    this.initializeWebRTC = this.initializeWebRTC.bind(this);
  }

  initializeWebRTC(socket: any, currentUser: any) {
    console.log('🔧 Initializing WebRTC service with socket and user:', { 
      socketConnected: !!socket, 
      userId: currentUser?.id 
    });
    this.webrtcService = new WebRTCService(socket, currentUser);
    console.log('✅ WebRTC service initialized');
  }

  isWebRTCInitialized(): boolean {
    return this.webrtcService !== null;
  }

  setWebRTCSessionId(sessionId: string) {
    if (this.webrtcService) {
      this.webrtcService.setSessionId(sessionId);
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      console.log('🎥 Starting screen share with getDisplayMedia()...');
      
      // Check if getDisplayMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported in this browser');
      }
      
      console.log('🎥 getDisplayMedia is supported');
      console.log('🎥 Available media devices:', await navigator.mediaDevices.enumerateDevices());
      
      console.log('🎥 About to call getDisplayMedia() - this should show a permission dialog...');
      
      // Get screen sharing stream - this will prompt user to select screen/window/tab
      // This uses the browser's native screen sharing API, not camera
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      console.log('🎥 getDisplayMedia() succeeded!');
      console.log('🎥 Stream details:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length
      });

      this.localStream = stream;
      console.log('Screen share started - using getDisplayMedia() for actual screen capture:', stream);
      console.log('Stream tracks:', stream.getTracks().map(track => ({ 
        kind: track.kind, 
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));

      // Handle stream end (when user stops sharing via browser UI)
      stream.getVideoTracks()[0].onended = () => {
        console.log('Screen share ended by user');
        this.stopScreenShare();
      };

      return stream;
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      console.error('❌ Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  async startWebRTCSharing(shareId: string): Promise<void> {
    console.log('🔧 Starting WebRTC sharing for shareId:', shareId);
    console.log('🔧 WebRTC service available:', !!this.webrtcService);
    console.log('🔧 Local stream available:', !!this.localStream);
    
    if (!this.webrtcService || !this.localStream) {
      throw new Error('WebRTC service not initialized or no local stream');
    }

    console.log('🔧 Calling webrtcService.startScreenSharing...');
    await this.webrtcService.startScreenSharing(shareId, this.localStream);
    console.log('✅ WebRTC sharing started successfully');
  }

  stopScreenShare(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.webrtcService) {
      this.webrtcService.cleanup();
    }

    console.log('Screen share stopped');
  }

  async joinScreenShare(shareId: string, onStreamReceived: (stream: MediaStream) => void): Promise<void> {
    try {
      console.log('🔗 Joining screen share via WebRTC for shareId:', shareId);
      this.onStreamReceived = onStreamReceived;
      
      if (this.webrtcService) {
        console.log('🔧 WebRTC service available, attempting to join...');
        await this.webrtcService.joinScreenSharing(shareId, (stream, shareId) => {
          console.log('🎥 WebRTC stream received:', stream);
          if (this.onStreamReceived) {
            this.onStreamReceived(stream);
          }
        });
      } else {
        console.log('❌ WebRTC service not available, using fallback');
        // Fallback to placeholder for now
      }
      
    } catch (error) {
      console.error('❌ Error joining screen share:', error);
      throw error;
    }
  }

  leaveScreenShare(shareId: string): void {
    if (this.webrtcService) {
      this.webrtcService.stopScreenSharing(shareId);
    }
    
    if (this.onStreamReceived) {
      this.onStreamReceived = null;
    }
    
    console.log('Left screen share:', shareId);
  }
}

export const screenShareService = new ScreenShareService(); 