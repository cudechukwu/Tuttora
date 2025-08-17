import React from 'react';
import { Trash2 } from 'lucide-react';

interface WithdrawConfirmBoxProps {
  onConfirm: () => void;
  onCancel: () => void;
  isWithdrawing?: boolean;
}

export default function WithdrawConfirmBox({ onConfirm, onCancel, isWithdrawing = false }: WithdrawConfirmBoxProps) {
  return (
    <div className="bg-white rounded-xl p-3 border border-red-200 hover:border-red-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Trash2 className="w-4 h-4 text-red-500" />
          <span className="text-xs font-medium px-2 py-1 rounded-full text-red-700 bg-red-100">
            Withdraw Request
          </span>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-900 mb-1">Withdraw this request?</h4>
        <p className="text-xs text-gray-700">This action cannot be undone.</p>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          disabled={isWithdrawing}
          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isWithdrawing}
          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex items-center space-x-1"
        >
          {isWithdrawing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>
              <span>Withdrawing...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3 h-3" />
              <span>Confirm</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 