'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, HeartIcon, UserIcon, UserGroupIcon, EllipsisVerticalIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useSocket } from '@/contexts/SocketContext'; // Re-enabled WebSocket

interface User {
  id: string;
  name: string;
  avatar?: string;
  role: 'tuto' | 'rookie';
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: User;
  type: 'text' | 'system';
  likes: string[];
  replies: Reply[];
}

interface Reply {
  id: string;
  content: string;
  timestamp: Date;
  sender: User;
}

interface ChatProps {
  sessionId: string;
  currentUser: User;
  onSendMessage: (message: string) => void;
  onLikeMessage: (messageId: string) => void;
  onReplyToMessage: (messageId: string, reply: string) => void;
  theme?: {
    primary: string;
    primaryHover: string;
    primaryBg: string;
    primaryBgHover: string;
    primaryLight: string;
  };
  canStartCall?: boolean;
}

export default function Chat({ sessionId, currentUser, onSendMessage, onLikeMessage, onReplyToMessage, theme, canStartCall }: ChatProps) {
  // Default theme (blue) if none provided
  const defaultTheme = {
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    primaryBg: 'rgba(96, 165, 250, 0.1)',
    primaryBgHover: 'rgba(96, 165, 250, 0.2)',
    primaryLight: 'rgba(96, 165, 250, 0.05)'
  };
  
  const currentTheme = theme || defaultTheme;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { socket, isConnected, sendMessage } = useSocket(); // Re-enabled WebSocket

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing messages from database
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Authentication token not found');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/chat/session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load messages');
        }

        const data = await response.json();
        
        // Transform database messages to match our Message interface
        const transformedMessages: Message[] = data.messages.map((msg: any) => {
          // Get the user's avatar from their profile
          const userAvatar = msg.sender.role === 'TUTO' 
            ? msg.sender.tutoProfile?.selectedAvatar 
            : msg.sender.rookieProfile?.selectedAvatar;
          
          return {
            id: msg.id,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
                      sender: {
            id: msg.sender.id,
            name: `${msg.sender.firstName} ${msg.sender.lastName}`,
            avatar: userAvatar ? (userAvatar.startsWith('/images/avatars/') ? userAvatar : `/images/avatars/${userAvatar}`) : undefined,
            role: msg.sender.role.toLowerCase() as 'tuto' | 'rookie'
          },
            type: msg.type as 'text' | 'system',
            likes: [], // Will be implemented later
            replies: [] // Will be implemented later
          };
        });

        // Remove duplicates based on message ID
        const uniqueMessages = transformedMessages.filter((message, index, self) => 
          index === self.findIndex(m => m.id === message.id)
        );

        setMessages(uniqueMessages);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadMessages();
    }
  }, [sessionId]);

  // Listen for new messages from WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData: any) => {
      // Transform the incoming message to match our interface
      const newMessage: Message = {
        id: messageData.id,
        content: messageData.content,
        timestamp: new Date(messageData.timestamp),
        sender: {
          id: messageData.sender.id,
          name: messageData.sender.name,
          avatar: messageData.sender.avatar ? (messageData.sender.avatar.startsWith('/images/avatars/') ? messageData.sender.avatar : `/images/avatars/${messageData.sender.avatar}`) : undefined,
          role: messageData.sender.role
        },
        type: messageData.type || 'text',
        likes: [],
        replies: []
      };

      // Check if message already exists to prevent duplicates
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          console.log('Duplicate message detected, skipping:', newMessage.id);
          return prev;
        }
        return [...prev, newMessage];
      });
    };

    const handleUserTyping = (data: any) => {
      if (data.userId !== currentUser.id) {
        setIsTyping(data.isTyping);
      }
    };

    const handleMessageError = (data: any) => {
      console.error('Message error:', data.error);
      // You could show a toast notification here
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('messageError', handleMessageError);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('messageError', handleMessageError);
    };
  }, [socket, currentUser.id]);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send message function
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    try {
      // Send via WebSocket for real-time (this also saves to database)
      sendMessage('sendMessage', {
        sessionId,
        content: newMessage.trim(),
        type: 'text'
      });

      setNewMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Send reply function
  const handleSendReply = () => {
    if (!replyText.trim() || !replyingTo) return;

    // For now, just send as a regular message
    // In the future, we can implement proper reply threading
    const replyMessage = `Replying to message: ${replyText.trim()}`;
    sendMessage('sendMessage', {
      sessionId,
      content: replyMessage,
      type: 'text'
    });

    setReplyText('');
    setReplyingTo(null);
  };

  // Handle like message
  const handleLikeMessage = (messageId: string) => {
    // For now, just log the like
    // In the future, we can implement proper like functionality
    console.log('Liked message:', messageId);
  };

  const isCurrentUser = (userId: string) => userId === currentUser.id;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle typing indicator
  const handleTypingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';

    // Send typing indicator
    if (socket && isConnected) {
      sendMessage('typing', { 
        sessionId, 
        isTyping: e.target.value.length > 0 
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 text-gray-800">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5" style={{ color: currentTheme.primary }} />
            <div>
              <h3 className="font-semibold text-base text-gray-800">Chat</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-600">Loading messages...</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col h-full bg-gray-50 text-gray-800">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5" style={{ color: currentTheme.primary }} />
            <div>
              <h3 className="font-semibold text-base text-gray-800">Chat</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Error loading messages</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <ChatBubbleLeftRightIcon className="w-5 h-5" style={{ color: currentTheme.primary }} />
          <div>
            <h3 className="font-semibold text-base text-gray-800">Chat</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isConnected ? '#10B981' : '#ef4444' }}></div>
              <span className="text-xs text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {isTyping && (
                <span className="text-xs" style={{ color: currentTheme.primary }}>• Someone is typing...</span>
              )}
            </div>
          </div>
        </div>
        {/* Meet Button */}
        <div className="flex items-center ml-4">
          <button
                            className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors ${canStartCall ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
            title={canStartCall ? 'Start Video Call' : 'You can only start a call when the session is active.'}
            aria-label={canStartCall ? 'Start Video Call' : 'You can only start a call when the session is active.'}
            onClick={() => {
              if (!canStartCall) return;
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('startVideoCall'));
              }
            }}
            disabled={!canStartCall}
          >
            <UserGroupIcon className={`w-4 h-4 ${canStartCall ? 'text-blue-600' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
        
      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-white">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="group">
              {message.type === 'system' ? (
                // System Message
                <div className="flex justify-center">
                  <div className="rounded-lg px-4 py-2 text-sm" style={{
                    backgroundColor: currentTheme.primaryBg,
                    border: `1px solid ${currentTheme.primary}`,
                    color: '#6b7280'
                  }}>
                    <div className="flex items-center">
                      <SparklesIcon className="w-4 h-4 mr-2" style={{ color: currentTheme.primary }} />
                      {message.content}
                    </div>
                  </div>
                </div>
              ) : (
                // User Message
                <div className={`flex ${isCurrentUser(message.sender.id) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${isCurrentUser(message.sender.id) ? 'order-2' : 'order-1'}`}>
                    {/* Avatar and Name */}
                    <div className={`flex items-center mb-1 ${isCurrentUser(message.sender.id) ? 'justify-end' : 'justify-start'}`}>
                      {!isCurrentUser(message.sender.id) && (
                        <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center bg-gray-300">
                          {message.sender.avatar ? (
                            <img src={message.sender.avatar} alt={message.sender.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            <UserIcon className="w-3 h-3" style={{ color: currentTheme.primary }} />
                          )}
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-600">
                        {message.sender.name}
                        {message.sender.role === 'tuto' && (
                          <span className="ml-1" style={{ color: currentTheme.primary }}>• Tuto</span>
                        )}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div className={`relative group ${isCurrentUser(message.sender.id) ? 'ml-auto' : 'mr-auto'}`}>
                      <div className={`
                        px-4 py-2 rounded-2xl text-sm leading-relaxed
                        ${isCurrentUser(message.sender.id) 
                          ? 'rounded-br-md' 
                          : 'rounded-bl-md'
                        }
                      `} style={{
                        backgroundColor: isCurrentUser(message.sender.id) 
                          ? currentTheme.primary 
                          : currentTheme.primaryBg,
                        color: isCurrentUser(message.sender.id) 
                          ? '#ffffff' 
                          : '#374151',
                        border: isCurrentUser(message.sender.id) 
                          ? 'none' 
                          : `1px solid ${currentTheme.primary}`
                      }}>
                        {message.content}
                      </div>
                      
                      {/* Message Actions */}
                      <div className={`
                        absolute top-0 ${isCurrentUser(message.sender.id) ? '-left-12' : '-right-12'}
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        flex items-center space-x-1
                      `}>
                        <button
                          onClick={() => handleLikeMessage(message.id)}
                          className="p-1 rounded-full transition-colors"
                          style={{
                            color: message.likes.includes(currentUser.id) 
                              ? '#ef4444' 
                              : '#6b7280',
                            backgroundColor: message.likes.includes(currentUser.id) 
                              ? 'rgba(239, 68, 68, 0.1)' 
                              : 'transparent'
                          }}
                        >
                          <HeartIcon className={`w-3 h-3 ${message.likes.includes(currentUser.id) ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => setReplyingTo(message.id)}
                          className="p-1 rounded-full transition-colors"
                          style={{
                            color: '#6b7280',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = currentTheme.primary;
                            e.currentTarget.style.backgroundColor = currentTheme.primaryBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6b7280';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <ChatBubbleLeftRightIcon className="w-3 h-3" />
                        </button>
                        <button className="p-1 rounded-full transition-colors"
                          style={{
                            color: '#6b7280',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = currentTheme.primary;
                            e.currentTarget.style.backgroundColor = currentTheme.primaryBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6b7280';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <EllipsisVerticalIcon className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* Message Info */}
                      <div className={`
                        flex items-center justify-between mt-1 text-xs
                        ${isCurrentUser(message.sender.id) ? 'text-right' : 'text-left'}
                      `} style={{ color: '#6b7280' }}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.likes.length > 0 && (
                          <span className="flex items-center">
                            <HeartIcon className="w-3 h-3 mr-1" />
                            {message.likes.length}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Replies */}
                    {message.replies.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.replies.map((reply) => (
                          <div key={reply.id} className="ml-4 pl-4 border-l-2" style={{ borderColor: currentTheme.primary }}>
                            <div className="flex items-center mb-1">
                              <div className="w-4 h-4 rounded-full mr-2 flex items-center justify-center bg-gray-300">
                                {reply.sender.avatar ? (
                                  <img src={reply.sender.avatar} alt={reply.sender.name} className="w-4 h-4 rounded-full" />
                                ) : (
                                  <UserIcon className="w-2 h-2" style={{ color: currentTheme.primary }} />
                                )}
                              </div>
                              <span className="text-xs font-medium text-gray-600">
                                {reply.sender.name}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                              {reply.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs text-gray-600">Replying to message</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="flex space-x-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              rows={1}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Reply
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleTypingChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
            rows={1}
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: newMessage.trim() && isConnected ? currentTheme.primary : '#e5e7eb',
              color: newMessage.trim() && isConnected ? '#ffffff' : '#9ca3af'
            }}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 