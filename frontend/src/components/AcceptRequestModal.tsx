import { useState } from 'react';
import { X, CheckCircle, Clock, User, MessageCircle } from 'lucide-react';

interface SessionRequest {
  id: string;
  subject: string;
  description: string;
  urgency: string;
  waitTime: string;
  rookie?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AcceptRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: SessionRequest | null;
  onAccept: (requestId: string) => Promise<void>;
  isAccepting: boolean;
  onReject: (requestId: string) => Promise<void>;
  isRejecting: boolean;
}

export default function AcceptRequestModal({
  isOpen,
  onClose,
  request,
  onAccept,
  isAccepting,
  onReject,
  isRejecting
}: AcceptRequestModalProps) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [rejected, setRejected] = useState(false);

  if (!isOpen || !request) return null;

  const handleAccept = async () => {
    try {
      await onAccept(request.id);
      onClose(); // Close immediately after accept
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async () => {
    try {
      await onReject(request.id);
      onClose(); // Close immediately after reject
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-md w-full transform transition-all border border-gray-200">
        {step === 'confirm' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-100 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-gray-700 tracking-tight">Accept Session Request</h2>
                  <p className="text-xs text-gray-500 font-medium tracking-tight italic font-serif">Help a student in need</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Request Details */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-gray-700 tracking-tight">{request.subject}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${request.urgency === 'Not urgent' ? 'bg-gray-100 text-gray-500 font-medium tracking-tight italic font-serif' : 'bg-gray-200 text-gray-700'}`}>{request.urgency}</span>
                </div>
                <p className="text-xs font-normal text-gray-900 mb-2">{request.description}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{request.waitTime} <span className="text-[10px] text-gray-500">waiting</span></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span className="text-[11px] text-gray-700 font-medium tracking-tight">{request.rookie?.firstName || 'Anonymous'} {request.rookie?.lastName || ''}</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="text-center mb-6">
                <p className="text-base font-medium text-gray-700 tracking-tight mb-2">
                  Are you sure you want to accept this session request?
                </p>
                <p className="text-xs text-gray-500 font-medium tracking-tight">
                  You'll be matched with <span className="font-semibold text-gray-700">{request.rookie?.firstName || 'Anonymous'}</span> and can start helping immediately.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleReject}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 border border-gray-200"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2 border border-gray-700"
                >
                  {isAccepting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Accept Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          // Success Step
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-base font-medium text-gray-700 tracking-tight mb-2">Request Accepted!</h3>
            <p className="text-sm text-gray-600 mb-4">
              You're now matched with <span className="font-semibold text-gray-700">{request.rookie?.firstName || 'Anonymous'}</span>. 
              You can start your session and begin helping.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700">
                Redirecting to session interface...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 