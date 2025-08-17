import React from 'react';
import { X } from 'lucide-react';
import { FormattedRequest } from '@/utils/sessionUtils';

interface ViewAllRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: FormattedRequest[];
  onRequestClick: (request: FormattedRequest) => void;
  onRejectRequest?: (requestId: string, event: React.MouseEvent) => void;
  isRejecting?: Set<string>;
}

export default function ViewAllRequestsModal({ 
  isOpen, 
  onClose, 
  requests, 
  onRequestClick, 
  onRejectRequest,
  isRejecting = new Set()
}: ViewAllRequestsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-pink-50">
          <h2 className="text-sm font-semibold text-gray-900">All Available Requests</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-pink-500 text-2xl font-bold">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {requests.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No requests available.</div>
          ) : (
            requests.map((request) => {
              // Card color logic (same as dashboard)
              let bgColor = '';
              if (request.urgency === 'Very urgent') bgColor = 'bg-gradient-to-r from-rose-100 via-orange-100 to-yellow-50 border border-rose-200';
              else if (request.urgency === 'Somewhat urgent') bgColor = 'bg-gradient-to-r from-orange-50 via-yellow-50 to-pink-50 border border-orange-200';
              else bgColor = 'bg-gradient-to-r from-yellow-50 via-pink-50 to-white border border-yellow-200';
              
              return (
                <div
                  key={request.id}
                  className={`rounded-xl p-4 hover:shadow-md transition-all cursor-pointer relative ${bgColor}`}
                  onClick={() => onRequestClick(request)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-pink-800">{request.subject}</span>
                      {/* Match Quality Label */}
                      {request.matchLabel && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.matchLabel === 'Perfect Match' ? 'bg-green-100 text-green-700' :
                          request.matchLabel === 'Excellent Fit' ? 'bg-blue-100 text-blue-700' :
                          request.matchLabel === 'Good Match' ? 'bg-yellow-100 text-yellow-700' :
                          request.matchLabel === 'Related Topic' ? 'bg-purple-100 text-purple-700' :
                          request.matchLabel === 'General Match' ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {request.matchLabel}
                        </span>
                      )}
                    </div>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                      {request.urgency}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2 line-clamp-2">{request.description}</div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {request.rookieName}</span>
                    <span>{request.waitTime} waiting</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 