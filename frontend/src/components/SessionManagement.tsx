import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  PlayCircleIcon,
  UserIcon,
  ClockIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useRookieSessionContext } from '@/contexts/RookieSessionContext';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/contexts/ToastContext';
import WithdrawConfirmBox from './WithdrawConfirmBox';

interface SessionManagementProps {
  onRefresh?: () => void;
  className?: string;
}

export default function SessionManagement({ onRefresh, className }: SessionManagementProps) {
  const { socket, isConnected, isAuthenticated } = useSocket();
  const { showToast } = useToast();
  const {
    requests,
    activeSessions,
    loading,
    error,
    fetchMyRequests,
    fetchActiveSessions,
    withdrawRequest,
    joinSession,
    getFormattedRequest
  } = useRookieSessionContext();

  // WebSocket listeners are now handled by the RookieSessionContext
  // No need to duplicate them here

  const [activeTab, setActiveTab] = useState<'requests' | 'active'>('requests');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawingRequestId, setWithdrawingRequestId] = useState<string | null>(null);
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedTutorName, setSelectedTutorName] = useState<string>('');

  const handleWithdrawClick = (sessionId: string) => {
    setWithdrawingRequestId(sessionId);
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawingRequestId) return;
    
    setWithdrawingId(withdrawingRequestId);
    try {
      await withdrawRequest(withdrawingRequestId);
      onRefresh?.();
    } finally {
      setWithdrawingId(null);
      setWithdrawingRequestId(null);
    }
  };

  const handleWithdrawCancel = () => {
    setWithdrawingRequestId(null);
  };

  const handleTutorClick = (sessionId: string, tutorName: string) => {
    setSelectedSessionId(sessionId);
    setSelectedTutorName(tutorName);
    setTutorModalOpen(true);
  };

  const handleTutorModalClose = () => {
    setTutorModalOpen(false);
    setSelectedSessionId('');
    setSelectedTutorName('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <ExclamationCircleIcon className="w-4 h-4 text-yellow-500" />;
      case 'ACCEPTED':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'PENDING_CONFIRMATION':
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
      case 'IN_PROGRESS':
        return <PlayCircleIcon className="w-4 h-4 text-gray-500" />;
      case 'CANCELLED':
        return <XMarkIcon className="w-4 h-4 text-red-400" />;
      default:
        return <ExclamationCircleIcon className="w-4 h-4 text-pink-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'Waiting for Tuto';
      case 'ACCEPTED':
        return 'Session Accepted';
      case 'PENDING_CONFIRMATION':
        return 'Waiting for Confirmation';
      case 'IN_PROGRESS':
        return 'In Progress';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'text-yellow-700 bg-yellow-50 border border-yellow-50';
      case 'ACCEPTED':
        return 'text-green-700 bg-green-50 border border-green-50';
      case 'PENDING_CONFIRMATION':
        return 'text-blue-700 bg-blue-50 border border-blue-50';
      case 'IN_PROGRESS':
        return 'text-blue-700 bg-blue-50 border border-blue-50';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Data is already fetched by RookieSessionContext
  // No need to duplicate the API calls here

  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm flex flex-col h-full ${className || ''}`.trim()}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-gray-700 font-medium tracking-tight text-xs md:text-sm">Session Management</h3>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1 rounded-lg text-xs font-medium tracking-tight transition-colors ${
              activeTab === 'requests'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1 rounded-lg text-xs font-medium tracking-tight transition-colors ${
              activeTab === 'active'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active Sessions ({activeSessions.length})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2 flex-shrink-0">
          <div className="flex items-center">
            <ExclamationCircleIcon className="w-3 h-3 text-red-500 mr-2" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Content - Flexible height with scroll */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'requests' ? (
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <ExclamationCircleIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-700 font-medium tracking-tight text-xs md:text-sm mb-1">No session requests yet</p>
                <p className="text-gray-500 text-[10px] font-medium tracking-tight italic font-serif">Create a request above to get started</p>
              </div>
            )}
            {requests.length > 0 && (
              requests.map((request) => {
                const formatted = getFormattedRequest(request);
                
                // Show withdraw confirmation modal instead of request card
                if (withdrawingRequestId === request.id) {
                  return (
                    <WithdrawConfirmBox
                      key={request.id}
                      onConfirm={handleWithdrawConfirm}
                      onCancel={handleWithdrawCancel}
                      isWithdrawing={withdrawingId === request.id}
                    />
                  );
                }
                
                return (
                  <div
                    key={request.id}
                    className={`bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm ${
                      request.status === 'ACCEPTED' ? 'border-green-300 bg-green-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>{getStatusText(request.status)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatted.waitTime}
                        </span>
                        {request.status === 'REQUESTED' && (
                          <button
                            onClick={() => handleWithdrawClick(request.id)}
                            disabled={withdrawingId === request.id}
                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                          >
                            {withdrawingId === request.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-red-500"></div>
                            ) : (
                              <TrashIcon className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-gray-900 mb-1">{formatted.subject}</h4>
                      {formatted.topic && (
                        <p className="text-xs text-gray-600 mb-1">{formatted.topic}</p>
                      )}
                      <p className="text-xs text-gray-700">{formatted.description}</p>
                    </div>
                    {request.tuto && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-3 h-3 text-gray-600" />
                          <button
                            onClick={() => handleTutorClick(request.id, `${request.tuto?.firstName || ''} ${request.tuto?.lastName || ''}`)}
                            className="text-xs text-gray-700 hover:text-gray-900 hover:underline transition-colors cursor-pointer"
                          >
                            Tuto: {request.tuto?.firstName} {request.tuto?.lastName}
                          </button>
                        </div>
                        {request.status === 'ACCEPTED' && (
                          <button
                            onClick={async () => {
                              try {
                                await joinSession(request.id);
                              } catch (error) {
                                console.error('Error joining session:', error);
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                          >
                            <PlayCircleIcon className="w-3 h-3" />
                            <span>Join Session</span>
                          </button>
                        )}
                        {request.status === 'PENDING_CONFIRMATION' && (
                          <button
                            onClick={async () => {
                              try {
                                await joinSession(request.id);
                              } catch (error) {
                                console.error('Error joining session:', error);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                          >
                            <PlayCircleIcon className="w-3 h-3" />
                            <span>Join Session</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <ExclamationCircleIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-700 font-medium tracking-tight text-xs md:text-sm mb-1">No active sessions</p>
                <p className="text-gray-500 text-[10px] font-medium tracking-tight italic font-serif">Accepted sessions will appear here</p>
              </div>
            )}
            {activeSessions.length > 0 && (
              activeSessions.map((session) => {
                const formatted = getFormattedRequest(session as any);
                return (
                  <div
                    key={session.id}
                    className={`bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm transition-all duration-300 ${
                      session.status === 'ACCEPTED' ? 'border-green-300 bg-green-50/50' : session.status === 'IN_PROGRESS' ? 'border-blue-300 bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>{getStatusText(session.status)}</span>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await joinSession(session.id);
                          } catch (error) {
                            console.error('Error joining session:', error);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                          session.status === 'ACCEPTED' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : session.status === 'IN_PROGRESS'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        <PlayCircleIcon className="w-3 h-3" />
                        <span>{session.status === 'ACCEPTED' ? 'Start Session' : session.status === 'IN_PROGRESS' ? 'In Progress' : 'Join Session'}</span>
                      </button>
                    </div>
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-gray-900 mb-1">{formatted.subject}</h4>
                      {formatted.topic && (
                        <p className="text-xs text-gray-600 mb-1">{formatted.topic}</p>
                      )}
                      <p className="text-xs text-gray-700">{formatted.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-3 h-3 text-gray-600" />
                        <button
                          onClick={() => handleTutorClick(session.id, `${session.tuto?.firstName || ''} ${session.tuto?.lastName || ''}`)}
                          className="text-xs text-gray-700 hover:text-gray-900 hover:underline transition-colors cursor-pointer"
                        >
                          Tuto: {session.tuto?.firstName} {session.tuto?.lastName}
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        {/* If you have a way to calculate remaining time, use it here. Otherwise, show a placeholder. */}
                        {session.startTime ? new Date(session.startTime).toLocaleTimeString() : '—'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Simple Tutor Info Modal */}
      {tutorModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleTutorModalClose}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-700 tracking-tight">Tutor Information</h2>
              <button
                onClick={handleTutorModalClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Basic Tutor Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-700 tracking-tight">{selectedTutorName}</h3>
                    <p className="text-sm text-gray-500">Tutor</p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-700 tracking-tight mb-2">Basic Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Name:</span>
                        <span className="text-xs font-medium text-gray-700">{selectedTutorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Role:</span>
                        <span className="text-xs font-medium text-gray-700">Tutor</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Status:</span>
                        <span className="text-xs font-medium text-green-600">Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <button
                    onClick={handleTutorModalClose}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium tracking-tight text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 