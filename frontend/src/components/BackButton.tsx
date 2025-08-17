'use client';

import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  showHomeIcon?: boolean;
  className?: string;
}

export default function BackButton({
  href = '/forum',
  onClick,
  label = 'Back to Forum',
  showHomeIcon = false,
  className = ""
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <ArrowLeftIcon className="w-4 h-4 mr-2" />
      {showHomeIcon && <HomeIcon className="w-4 h-4 mr-1" />}
      {label}
    </button>
  );
} 