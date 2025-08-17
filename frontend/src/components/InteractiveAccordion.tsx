'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
}

interface InteractiveAccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function InteractiveAccordion({ items, className = "" }: InteractiveAccordionProps) {
  const [activeItem, setActiveItem] = useState<string | null>(items[0]?.id || null);
  const [animationDirection, setAnimationDirection] = useState<'up' | 'down'>('down');

  const toggleItem = (itemId: string) => {
    if (activeItem === itemId) {
      // Don't allow closing the last open item
      return;
    } else {
      // Determine animation direction based on item position
      const currentIndex = items.findIndex(item => item.id === activeItem);
      const newIndex = items.findIndex(item => item.id === itemId);
      
      if (currentIndex === -1 || newIndex < currentIndex) {
        setAnimationDirection('down'); // Opening item above current
      } else {
        setAnimationDirection('up'); // Opening item below current
      }
      
      setActiveItem(itemId);
    }
  };

  return (
    <div className={`space-y-0 ${className}`}>
      {items.map((item, index) => (
        <div key={item.id}>
          <button
            onClick={() => toggleItem(item.id)}
            className="w-full py-6 text-left flex items-center justify-between focus:outline-none transition-all duration-300"
          >
            <h3 
              className={`text-lg sm:text-xl font-semibold transition-colors duration-300 leading-tight`}
              style={{ 
                fontFamily: 'Suisse Intl, Arial, sans-serif',
                color: activeItem === item.id ? '#1f2937' : '#6b7280'
              }}
            >
              {item.title}
            </h3>
            <div className="flex-shrink-0 ml-4">
              {activeItem === item.id ? (
                <Minus className="w-5 h-5 text-gray-700" />
              ) : (
                <Plus className="w-5 h-5 text-gray-700" />
              )}
            </div>
          </button>
          
          {activeItem === item.id && (
            <div className="pb-6 overflow-hidden">
              <div 
                className="transform transition-all duration-1000 ease-out"
                style={{
                  animation: animationDirection === 'down' 
                    ? 'slideDown 1s ease-out forwards' 
                    : 'slideUp 1s ease-out forwards'
                }}
              >
                <p 
                  className="mb-4 leading-relaxed text-sm sm:text-base"
                  style={{ 
                    fontFamily: 'Suisse Intl, Arial, sans-serif',
                    color: '#9ca3af'
                  }}
                >
                  {item.description}
                </p>
                {item.buttonText && item.buttonLink && (
                  <button 
                    className="px-4 sm:px-6 py-2 sm:py-3 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors font-medium tracking-tight bg-gray-600 hover:bg-gray-700"
                    style={{ 
                      fontFamily: 'Suisse Intl, Arial, sans-serif'
                    }}
                  >
                    {item.buttonText}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {index < items.length - 1 && (
            <div className="border-b border-gray-400"></div>
          )}
        </div>
      ))}
    </div>
  );
} 