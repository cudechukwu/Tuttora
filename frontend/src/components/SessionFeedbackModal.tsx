import React, { useState } from 'react';
import { StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface SessionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string, isAnonymous: boolean) => void;
  sessionId: string;
  partnerName: string;
  courseTitle: string;
}

const SessionFeedbackModal: React.FC<SessionFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sessionId,
  partnerName,
  courseTitle
}) => {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleSubmit = async () => {
    if (rating === 0) return; // Require at least 1 star
    
    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedback, isAnonymous);
      // Reset form
      setRating(0);
      setFeedback('');
      setIsAnonymous(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setFeedback('');
    setIsAnonymous(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 font-suisse">How was your session?</h3>
            <p className="text-sm text-gray-600 mt-1 font-suisse">
              Rate your session with {partnerName} • {courseTitle}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3 font-suisse">Rate your experience: <span className="text-red-500">*</span></p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                className="transition-transform hover:scale-110"
              >
                {star <= rating ? (
                  <StarIconSolid className="w-8 h-8 text-yellow-400" />
                ) : (
                  <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 font-suisse">
            {rating === 0 && "Tap the stars to rate"}
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        </div>

        {/* Optional Feedback */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-suisse">
            Optional feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="How was your session? Any suggestions?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-suisse"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1 font-suisse">
            {feedback.length}/200 characters
          </p>
        </div>

        {/* Anonymous Feedback Option */}
        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 font-suisse">
              Submit feedback anonymously
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 font-suisse">
            Your name will not be shown with this feedback
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-suisse font-medium tracking-tight"
          >
            Skip Rating
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-suisse font-medium tracking-tight"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionFeedbackModal; 