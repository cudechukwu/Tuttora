'use client';



interface CommentDeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function CommentDeleteConfirm({ onConfirm, onCancel, isDeleting = false }: CommentDeleteConfirmProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onCancel}
        disabled={isDeleting}
        className="px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={isDeleting}
        className="px-2 py-1 rounded text-xs font-medium transition-colors bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex items-center space-x-1"
      >
        {isDeleting ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>
            <span>Deleting...</span>
          </>
        ) : (
          <span>Confirm</span>
        )}
      </button>
    </div>
  );
} 