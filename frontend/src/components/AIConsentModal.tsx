import { useState } from 'react';

interface AIConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void; // Optional, in case you want a close button for dev/testing
}

export type { AIConsentModalProps };

export default function AIConsentModal({ isOpen, onAccept, onClose }: AIConsentModalProps) {
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 rounded-t-2xl flex items-center justify-between bg-gray-50 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">AI Features Consent Required</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-700 mb-4">
            We use AI to generate session summaries, provide suggestions, and power the assistant. <br />
            <span className="font-medium">All data is anonymized for your privacy.</span>
          </p>
          <div className="mb-4 flex items-start">
            <input
              id="ai-consent-checkbox"
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
                                  className="mt-1 mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="ai-consent-checkbox" className="text-gray-800 text-sm select-none">
              I have read and accept the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">AI Terms of Use</a>.
            </label>
          </div>
          <button
            onClick={async () => {
              setIsLoading(true);
              await onAccept();
              setIsLoading(false);
            }}
            disabled={!checked || isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 hover:bg-blue-700 mt-2"
          >
            {isLoading ? 'Accepting...' : 'Accept'}
          </button>
          <div className="mt-4 text-xs text-gray-500 text-center">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Read our full AI Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
} 