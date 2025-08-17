import React from 'react';

interface ActionItem {
  id: string;
  text: string;
  checked?: boolean;
}

interface SessionSummaryCardProps {
  loading?: boolean;
  summary?: string;
  actionItems?: ActionItem[];
  keyConcepts?: string[];
  source?: 'ai' | 'human' | 'imported' | 'scripted';
  onFeedback?: (rating: 'up' | 'down') => void;
  feedback?: 'up' | 'down' | null;
}

export default function SessionSummaryCard({
  loading = false,
  summary,
  actionItems = [],
  keyConcepts = [],
  source = 'ai',
  onFeedback,
  feedback,
}: SessionSummaryCardProps) {
  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-xl shadow p-6 mb-4 border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-3/4 mb-4" />
        <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
        <div className="flex gap-2 mt-4">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-12 bg-gray-100 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Session Summary</span>
        {source === 'ai' && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full font-medium">AI Generated</span>
        )}
      </div>
      <div className="text-gray-800 mb-4 whitespace-pre-line">{summary}</div>
      {actionItems.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-1">Action Items</div>
          <ul className="space-y-1">
            {actionItems.map(item => (
              <li key={item.id} className="flex items-center gap-2">
                <input type="checkbox" checked={item.checked} readOnly className="accent-green-500" />
                <span className={item.checked ? 'line-through text-gray-400' : ''}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {keyConcepts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {keyConcepts.map(concept => (
            <span key={concept} className="px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600">{concept}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mt-2">
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition text-green-600 ${feedback === 'up' ? 'bg-green-100 font-bold' : ''}`}
          onClick={() => onFeedback && onFeedback('up')}
          aria-label="Thumbs up"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-6 0v4m-4 4h16l-1.38 6.59A2 2 0 0116.66 21H7a2 2 0 01-2-2v-5z" /></svg>
          <span className="text-xs">Good</span>
        </button>
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition text-red-600 ${feedback === 'down' ? 'bg-red-100 font-bold' : ''}`}
          onClick={() => onFeedback && onFeedback('down')}
          aria-label="Thumbs down"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 15v4a3 3 0 006 0v-4m4-4H4l1.38-6.59A2 2 0 017.34 3H17a2 2 0 012 2v5z" /></svg>
          <span className="text-xs">Needs Work</span>
        </button>
      </div>
    </div>
  );
} 