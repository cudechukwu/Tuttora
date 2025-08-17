interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'screen-share-start' | 'screen-share-stop';
  data: any;
  from: string;
  to: string;
  sessionId: string;
  shareId: string;
}

export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStreams: Map<string, MediaStream> = new Map();
  private onStreamReceived: ((stream: MediaStream, shareId: string) => void) | null = null;
  private socket: any = null;
  private currentUser: any = null;
  private sessionId: string = '';

  constructor(socket: any, currentUser: any) {
    console.log('🔧 WebRTC Service constructor called with:', { 
      socketConnected: !!socket, 
      userId: currentUser?.id 
    });
    this.socket = socket;
    this.currentUser = currentUser;
    this.setupSocketListeners();
    console.log('✅ WebRTC Service setup complete');
  }

  private setupSocketListeners() {
    if (!this.socket) {
      console.error('❌ No socket available for WebRTC service');
      return;
    }

    console.log('🔧 Setting up WebRTC socket listeners...');
    this.socket.on('webrtc-signal', this.handleWebRTCSignal.bind(this));
    
    // Test if socket is working
    this.socket.on('connect', () => {
      console.log('🔌 WebRTC service socket connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('🔌 WebRTC service socket disconnected');
    });
    
    console.log('✅ WebRTC socket listeners setup complete');
  }

  private async handleWebRTCSignal(message: WebRTCMessage) {
    console.log('📡 WebRTC signal received:', message);
    console.log('📡 Signal details:', {
      type: message.type,
      from: message.from,
      shareId: message.shareId,
      sessionId: message.sessionId
    });

    const { type, data, from, shareId } = message;

    // Don't process our own signals
    console.log('🔍 Signal from:', from, 'Current user ID:', this.currentUser?.id);
    if (from === this.currentUser?.id) {
      console.log('🔄 Ignoring own signal');
      return;
    }

    console.log('🔗 Processing signal from:', from, 'type:', type);
    const peerConnection = this.getOrCreatePeerConnection(shareId);

    try {
      switch (type) {
        case 'offer':
          console.log('📤 Handling offer...');
          await this.handleOffer(peerConnection, data, shareId);
          break;
        case 'answer':
          console.log('📥 Handling answer...');
          await this.handleAnswer(peerConnection, data);
          break;
        case 'ice-candidate':
          console.log('🧊 Handling ICE candidate...');
          await this.handleIceCandidate(peerConnection, data);
          break;
        default:
          console.log('❓ Unknown signal type:', type);
      }
    } catch (error) {
      console.error('❌ Error handling WebRTC signal:', error);
    }
  }

  private getOrCreatePeerConnection(shareId: string): RTCPeerConnection {
    if (this.peerConnections.has(shareId)) {
      return this.peerConnections.get(shareId)!;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    // Handle incoming streams
                peerConnection.ontrack = (event) => {
              console.log('🎥 WebRTC: Received remote stream:', event.streams[0]);
              console.log('🎥 WebRTC: Stream tracks:', event.streams[0].getTracks().map(track => ({ kind: track.kind, label: track.label })));
              console.log('🎥 WebRTC: Stream details:', {
                id: event.streams[0].id,
                active: event.streams[0].active,
                tracks: event.streams[0].getTracks().length
              });
              if (this.onStreamReceived) {
                console.log('🎥 WebRTC: Calling onStreamReceived callback');
                this.onStreamReceived(event.streams[0], shareId);
              } else {
                console.log('❌ WebRTC: onStreamReceived callback is null');
              }
            };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          data: event.candidate,
          shareId
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 WebRTC: Peer connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log('✅ WebRTC: Peer connection established successfully!');
      } else if (peerConnection.connectionState === 'failed') {
        console.error('❌ WebRTC: Peer connection failed');
      }
    };

    this.peerConnections.set(shareId, peerConnection);
    return peerConnection;
  }

  private async handleOffer(peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit, shareId: string) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.sendSignal({
      type: 'answer',
      data: answer,
      shareId
    });
  }

  private async handleAnswer(peerConnection: RTCPeerConnection, answer: RTCSessionDescriptionInit) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate(peerConnection: RTCPeerConnection, candidate: RTCIceCandidateInit) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private sendSignal(message: Omit<WebRTCMessage, 'from' | 'to' | 'sessionId'>) {
    if (!this.socket || !this.currentUser) {
      console.error('❌ Cannot send signal: socket or user not available');
      return;
    }

    const signalMessage = {
      ...message,
      from: this.currentUser.id,
      to: 'broadcast', // Send to all participants in session
      sessionId: this.sessionId
    };

    console.log('📡 Sending WebRTC signal:', signalMessage);
    console.log('📡 Signal details:', {
      type: message.type,
      shareId: message.shareId,
      sessionId: this.sessionId,
      userId: this.currentUser.id
    });
    
    if (!this.sessionId) {
      console.error('❌ No session ID set for WebRTC signaling!');
    }
    
    this.socket.emit('webrtc-signal', signalMessage);
  }

  setSessionId(sessionId: string) {
    // Update the session ID for signaling
    console.log('🔧 Setting WebRTC session ID:', sessionId);
    this.sessionId = sessionId;
  }

  async startScreenSharing(shareId: string, stream: MediaStream): Promise<void> {
    try {
      console.log('🎥 Starting WebRTC screen sharing for shareId:', shareId);
      console.log('🎥 Stream details:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length
      });
      
      this.localStreams.set(shareId, stream);
      const peerConnection = this.getOrCreatePeerConnection(shareId);

      // Add local stream tracks to peer connection
      console.log('🎥 Adding tracks to peer connection...');
      stream.getTracks().forEach(track => {
        console.log('🎥 Adding track:', { kind: track.kind, label: track.label });
        peerConnection.addTrack(track, stream);
      });

      // Create and send offer
      console.log('🎥 Creating offer...');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log('🎥 Sending offer signal...');
      this.sendSignal({
        type: 'offer',
        data: offer,
        shareId
      });

      console.log('✅ WebRTC screen sharing started');
    } catch (error) {
      console.error('❌ Error starting WebRTC screen sharing:', error);
      throw error;
    }
  }

  async joinScreenSharing(shareId: string, onStreamReceived: (stream: MediaStream, shareId: string) => void): Promise<void> {
    try {
      console.log('🔗 Joining WebRTC screen sharing for shareId:', shareId);
      
      this.onStreamReceived = onStreamReceived;
      const peerConnection = this.getOrCreatePeerConnection(shareId);

      console.log('📤 Creating offer to request stream...');
      // Create and send offer to request stream
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log('📡 Sending offer signal...');
      this.sendSignal({
        type: 'offer',
        data: offer,
        shareId
      });

      console.log('✅ WebRTC screen sharing join initiated');
    } catch (error) {
      console.error('❌ Error joining WebRTC screen sharing:', error);
      throw error;
    }
  }

  stopScreenSharing(shareId: string): void {
    console.log('Stopping WebRTC screen sharing for shareId:', shareId);

    const peerConnection = this.peerConnections.get(shareId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(shareId);
    }

    const localStream = this.localStreams.get(shareId);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      this.localStreams.delete(shareId);
    }

    console.log('WebRTC screen sharing stopped');
  }

  cleanup(): void {
    console.log('Cleaning up WebRTC service');
    
    this.peerConnections.forEach((pc, shareId) => {
      pc.close();
    });
    this.peerConnections.clear();

    this.localStreams.forEach((stream, shareId) => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.localStreams.clear();

    this.onStreamReceived = null;
  }
} 