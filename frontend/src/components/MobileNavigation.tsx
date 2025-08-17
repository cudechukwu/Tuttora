'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="text-white hover:text-blue-400 transition-colors p-2 -mr-2"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <Link href="/" className="flex items-center space-x-3" onClick={closeMenu}>
                <Image
                  src="/images/logo/TP_Logo.png"
                  alt="Tuttora"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
                  Tuttora
                </span>
              </Link>
              <button
                onClick={closeMenu}
                className="text-gray-400 hover:text-white transition-colors p-2"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-6 py-8">
              <div className="space-y-8">
                <Link
                  href="/auth/register"
                  className="block text-white hover:text-blue-400 transition-colors text-xl font-medium py-4 border-b border-gray-700"
                  onClick={closeMenu}
                  style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  className="block text-white hover:text-blue-400 transition-colors text-xl font-medium py-4 border-b border-gray-700"
                  onClick={closeMenu}
                  style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                >
                  Login
                </Link>
                <Link
                  href="#how-it-works"
                  className="block text-white hover:text-blue-400 transition-colors text-xl font-medium py-4 border-b border-gray-700"
                  onClick={closeMenu}
                  style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}
                >
                  How It Works
                </Link>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700">
              <p className="text-gray-400 text-sm text-center" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                A better way to learn.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 