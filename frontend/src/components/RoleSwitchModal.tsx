"use client";

import { useState } from 'react';
import { X, AlertTriangle, ArrowRight } from 'lucide-react';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentRole: 'ROOKIE' | 'TUTO' | 'BOTH';
  targetRole: 'ROOKIE' | 'TUTO';
  userName: string;
}

export default function RoleSwitchModal({
  isOpen,
  onClose,
  onConfirm,
  currentRole,
  targetRole,
  userName
}: RoleSwitchModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ROOKIE': return 'Rookie';
      case 'TUTO': return 'Tuto';
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ROOKIE': return 'Receive help from experienced tutors';
      case 'TUTO': return 'Help other students with their studies';
      default: return '';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ROOKIE': return 'gray';
      case 'TUTO': return 'gray';
      default: return 'gray';
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const colorClasses = {
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      button: 'bg-gray-600 hover:bg-gray-700',
      icon: 'text-gray-600'
    }
  };

  const targetColor = getRoleColor(targetRole);
  const colorClass = colorClasses[targetColor as keyof typeof colorClasses];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full ${colorClass.border} border-2`}>
        {/* Header */}
        <div className={`${colorClass.bg} px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${colorClass.bg} flex items-center justify-center`}>
              <AlertTriangle className={`w-5 h-5 ${colorClass.icon}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 font-suisse text-sm">Switch Role</h3>
              <p className="text-xs text-gray-600 font-suisse">Confirm your role change</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4 font-suisse text-sm">
              Hi <span className="font-medium">{userName}</span>, are you sure you want to switch to{' '}
              <span className={`font-semibold ${colorClass.text}`}>
                {getRoleDisplayName(targetRole)} Mode
              </span>?
            </p>
            
            <div className={`${colorClass.bg} rounded-lg p-4 border ${colorClass.border}`}>
              <div className="flex items-center space-x-3">
                <ArrowRight className={`w-5 h-5 ${colorClass.icon}`} />
                <div>
                  <p className={`font-medium ${colorClass.text} font-suisse text-sm`}>
                    {getRoleDisplayName(targetRole)} Mode
                  </p>
                  <p className="text-xs text-gray-600 font-suisse">
                    {getRoleDescription(targetRole)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-yellow-800 mb-1 font-suisse">Important Note</p>
                <p className="text-xs text-yellow-700 font-suisse">
                  You may need to complete your profile for this role before you can start using all features.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-suisse text-[10px] md:text-xs font-semibold font-medium tracking-tight"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 md:px-6 py-2 md:py-3 text-white rounded-lg transition-colors disabled:opacity-50 ${colorClass.button} font-suisse text-[10px] md:text-xs font-semibold font-medium tracking-tight`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Switching...</span>
                </div>
              ) : (
                `Switch to ${getRoleDisplayName(targetRole)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 