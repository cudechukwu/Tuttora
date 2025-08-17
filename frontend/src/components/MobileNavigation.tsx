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
        className="text-white hover:text-blue-300 transition-colors p-2 -mr-2"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? (
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex justify-between items-center p-4 border-b border-white/20">
              <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
                <Image
                  src="/images/logo/TP_Logo.png"
                  alt="Tuttora"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Tuttora
                </span>
              </Link>
              <button
                onClick={closeMenu}
                className="text-white hover:text-blue-300 transition-colors p-2"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-8">
              <div className="space-y-6">
                <Link
                  href="/features"
                  className="block text-white hover:text-blue-300 transition-colors text-lg font-medium py-3 border-b border-white/10"
                  onClick={closeMenu}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="block text-white hover:text-blue-300 transition-colors text-lg font-medium py-3 border-b border-white/10"
                  onClick={closeMenu}
                >
                  Pricing
                </Link>
                <Link
                  href="/premium"
                  className="block text-white hover:text-blue-300 transition-colors text-lg font-medium py-3 border-b border-white/10"
                  onClick={closeMenu}
                >
                  Premium
                </Link>
              </div>
            </nav>

            {/* Auth Buttons */}
            <div className="p-4 border-t border-white/20 space-y-4">
              <Link
                href="/auth/login"
                className="block text-white hover:text-blue-300 transition-colors text-lg font-medium py-3 text-center"
                onClick={closeMenu}
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="block bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors text-lg font-medium text-center border border-white/30"
                onClick={closeMenu}
              >
                Start now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 