'use client';

import Link from 'next/link'
import Image from 'next/image'
import {
  BoltIcon,
  CheckCircleIcon,
  HeartIcon,
  UsersIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';


import { useEffect, useState, useRef } from 'react'
import { 
  ArrowRight, 
} from 'lucide-react'
import AnimatedCounter from '@/components/AnimatedCounter'
import InteractiveAccordion from '@/components/InteractiveAccordion'
import MobileNavigation from '@/components/MobileNavigation'

export default function HomePage() {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const mobileTestimonialsRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [videoScale, setVideoScale] = useState(1.1);

  // Testimonials data
  const testimonialsData = [
    {
      id: 1,
      type: 'rookie',
      icon: '🧠',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      typeColor: 'text-blue-700',
      text: "I was stuck on my programming assignment at 2 AM and found help instantly through Tuttora. The community support is amazing - someone actually understood my problem and walked me through it step by step.",
      name: "Ian S.",
      role: "Engineering '24",
      image: "/images/landing/testimonials/ian.jpeg",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      nameColor: "text-blue-800",
      roleColor: "text-blue-600"
    },
    {
      id: 2,
      type: 'tuto',
      icon: '⚡',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      typeColor: 'text-slate-700',
      text: "I love giving back to the community! As a Tuto, I've helped dozens of students while building my reputation. The platform makes it so easy to connect with people who need my expertise.",
      name: "Cyris L.",
      role: "Math Major",
      image: "/images/landing/testimonials/cyris.jpg",
      bgColor: "bg-slate-50",
      borderColor: "border-gray-100",
      nameColor: "text-slate-800",
      roleColor: "text-slate-500"
    },
    {
      id: 3,
      type: 'rookie',
      icon: '🧠',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      typeColor: 'text-blue-700',
      text: "The community aspect is what makes Tuttora special. I've made friends while studying together, and the peer support has been invaluable for my academic journey.",
      name: "Chloe B.",
      role: "Biology '26",
      image: "/images/landing/testimonials/chloe.jpg",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      nameColor: "text-blue-800",
      roleColor: "text-blue-600"
    },
    {
      id: 4,
      type: 'tuto',
      icon: '⚡',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      typeColor: 'text-slate-700',
      text: "Being a Tuto has been incredibly rewarding. I've helped students from different backgrounds and seeing their 'aha' moments makes it all worth it. The platform's verification system gives students confidence in my expertise.",
      name: "Ben M.",
      role: "Physics '25",
      image: "/images/landing/testimonials/Ben.jpg",
      bgColor: "bg-slate-50",
      borderColor: "border-gray-100",
      nameColor: "text-slate-800",
      roleColor: "text-slate-500"
    },
    {
      id: 5,
      type: 'rookie',
      icon: '🧠',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      typeColor: 'text-blue-700',
      text: "I was stuck on my programming assignment at 2 AM and found help instantly through Tuttora. The community support is amazing - someone actually understood my problem and walked me through it step by step.",
      name: "Xander",
      role: "CS '27",
      image: "/images/landing/testimonials/xander.png",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      nameColor: "text-blue-800",
      roleColor: "text-blue-600"
    },
    {
      id: 6,
      type: 'tuto',
      icon: '⚡',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      typeColor: 'text-slate-700',
      text: "Being a Tuto has been incredibly rewarding. I've helped students from different backgrounds and seeing their 'aha' moments makes it all worth it. The platform's verification system gives students confidence in my expertise.",
      name: "Jake W.",
      role: "CS '26",
      image: "/images/landing/testimonials/Jake.png",
      bgColor: "bg-slate-50",
      borderColor: "border-gray-100",
      nameColor: "text-slate-800",
      roleColor: "text-slate-500"
    }
  ];

  // Create duplicated testimonials for seamless looping
  const duplicatedTestimonials = [...testimonialsData, ...testimonialsData];

  // Hero scroll fade effect
  useEffect(() => {
    const handleScroll = () => {
      const heroContent = document.getElementById('hero-content');
      if (heroContent) {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Start fading when user scrolls past 30% of viewport height
        const fadeStart = windowHeight * 0.3;
        // Complete fade when user scrolls past 80% of viewport height  
        const fadeEnd = windowHeight * 0.8;
        
        let opacity = 1;
        
        if (scrollY > fadeStart) {
          if (scrollY >= fadeEnd) {
            opacity = 0;
          } else {
            // Calculate opacity between fadeStart and fadeEnd
            const fadeProgress = (scrollY - fadeStart) / (fadeEnd - fadeStart);
            opacity = 1 - fadeProgress;
          }
        }
        
        heroContent.style.opacity = opacity.toString();
        heroContent.style.transform = `translateY(${scrollY * 0.5}px)`; // Parallax effect
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialsRef.current) {
      // Get current screen width to determine card width
      const screenWidth = window.innerWidth;
      let cardWidth = 296; // Default for mobile (280px + 16px gap)
      
      if (screenWidth >= 1024) {
        cardWidth = 376; // Large screens (360px + 16px gap)
      } else if (screenWidth >= 640) {
        cardWidth = 336; // Medium screens (320px + 16px gap)
      }
      
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      testimonialsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const navbar = document.getElementById('navbar');
    
    const handleScroll = () => {
      if (navbar) {
        const scrollPosition = window.scrollY;
        const heroHeight = window.innerHeight;
        
        if (scrollPosition > heroHeight * 0.8) {
          navbar.style.backgroundColor = '#6B6E7A';
          navbar.style.backdropFilter = 'blur(10px)';
        } else {
          navbar.style.backgroundColor = 'transparent';
          navbar.style.backdropFilter = 'none';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Responsive video scaling
  useEffect(() => {
    const updateVideoScale = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVideoScale(3.5); // Mobile - reduced for better performance and coverage
      } else if (width < 768) {
        setVideoScale(3.0); // Small tablets - reduced for better performance
      } else if (width < 1024) {
        setVideoScale(2.5); // Tablets - reduced for better performance
      } else if (width < 1280) {
        setVideoScale(1.8); // Small desktop - reduced for better coverage
      } else {
        setVideoScale(1.1); // Large desktop - kept the same
      }
    };

    updateVideoScale();
    window.addEventListener('resize', updateVideoScale);
    return () => window.removeEventListener('resize', updateVideoScale);
  }, []);

  // Auto-scroll testimonials
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      autoScrollIntervalRef.current = setInterval(() => {
        if (isAutoScrolling) {
          // Scroll desktop testimonials
          if (testimonialsRef.current) {
            const scrollAmount = 1; // Slow scroll speed
            testimonialsRef.current.scrollLeft += scrollAmount;
            
            // Reset to beginning when reaching the end of original testimonials
            const originalWidth = testimonialsRef.current.scrollWidth / 2;
            if (testimonialsRef.current.scrollLeft >= originalWidth) {
              testimonialsRef.current.scrollLeft = 0;
            }
          }
          
          // Scroll mobile testimonials
          if (mobileTestimonialsRef.current) {
            const scrollAmount = 1; // Slow scroll speed
            mobileTestimonialsRef.current.scrollLeft += scrollAmount;
            
            // Reset to beginning when reaching the end of original testimonials
            const originalWidth = mobileTestimonialsRef.current.scrollWidth / 2;
            if (mobileTestimonialsRef.current.scrollLeft >= originalWidth) {
              mobileTestimonialsRef.current.scrollLeft = 0;
            }
          }
        }
      }, 50); // Update every 50ms for smooth animation
    };

    if (isAutoScrolling) {
      startAutoScroll();
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling]);

  // Pause auto-scroll on hover
  const handleTestimonialsMouseEnter = () => {
    setIsAutoScrolling(false);
  };

  const handleTestimonialsMouseLeave = () => {
    setIsAutoScrolling(true);
  };

  // Testimonial component
  const TestimonialCard = ({ testimonial, isMobile = false }: { testimonial: any, isMobile?: boolean }) => (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-lg relative ${isMobile ? 'w-[280px]' : 'w-[280px] sm:w-[320px] lg:w-[360px]'} flex-shrink-0 border border-gray-100`}>
      <div className={`${isMobile ? 'p-6 h-80' : 'p-6 sm:p-7 lg:p-8 h-80 sm:h-88 lg:h-96'} flex flex-col`}>
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 ${testimonial.iconBg} rounded-full flex items-center justify-center mr-3`}>
            <span className={`${testimonial.iconColor} font-bold text-sm`}>{testimonial.icon}</span>
          </div>
          <span className={`${testimonial.typeColor} font-semibold`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            {testimonial.type === 'rookie' ? 'Rookie' : 'Tuto'}
          </span>
        </div>
        <p className={`text-slate-600 leading-loose flex-1 ${isMobile ? 'text-sm' : 'text-base'} italic`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
          {testimonial.text}
        </p>
      </div>
      <div className={`${testimonial.bgColor} border-t ${testimonial.borderColor} ${isMobile ? 'p-4' : 'p-6'} relative`}>
        <div className="flex items-center">
          <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden ${isMobile ? 'mr-3' : 'mr-4'}`}>
            <Image
              src={testimonial.image}
              alt={testimonial.name}
              width={isMobile ? 40 : 48}
              height={isMobile ? 40 : 48}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className={`${testimonial.nameColor} font-semibold ${isMobile ? 'text-sm' : ''}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              {testimonial.name}
            </p>
            <p className={`${testimonial.roleColor} ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              {testimonial.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-transparent">
      {/* Consolidated Vimeo Video Background - Spans Full Page */}
      <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
        <iframe
          src="https://player.vimeo.com/video/1103292463?background=1&autoplay=1&loop=1&byline=0&title=0&autopause=0&muted=1"
          className="w-full h-full"
          style={{ 
            filter: 'brightness(0.7) contrast(1.1)',
            pointerEvents: 'none',
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${videoScale})`,
            minWidth: '100vw',
            minHeight: '100vh'
          }}
          frameBorder="0"
          allow="autoplay; fullscreen"
          title="Tuttora Landing Video"
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      </div>

      {/* Navigation Header */}
      <nav className="bg-transparent sticky top-0 z-50 relative transition-colors duration-300" id="navbar">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-16">
            {/* Logo - Left */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/images/logo/TP_Logo.png"
                  alt="Tuttora"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain"
                />
                <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Tuttora
                </span>
              </Link>
            </div>
            
            {/* Navigation Links - Center (Desktop Only) */}
            <div className="hidden md:flex items-center space-x-8">
                          <Link href="/features" className="text-white hover:text-blue-300 transition-colors font-suisse-garamond">
              Features
            </Link>
            <Link href="/pricing" className="text-white hover:text-blue-300 transition-colors font-suisse-garamond">
              Pricing
            </Link>
            <Link href="/premium" className="text-white hover:text-blue-300 transition-colors font-suisse-garamond">
              Premium
            </Link>
            </div>
            
            {/* Auth Buttons - Right (Desktop Only) */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/auth/login" className="text-white hover:text-blue-300 transition-colors font-suisse">
                Log in
              </Link>
              <Link href="/auth/register" className="bg-white/20 text-white px-6 py-2 rounded-xl hover:bg-white/30 transition-colors font-suisse-garamond font-medium border border-white/30">
                Start now
              </Link>
            </div>

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex flex-col justify-center items-center pt-2 sm:pt-3 md:pt-4 lg:pt-6 pb-8 sm:pb-12 md:pb-8 lg:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-4xl mx-auto text-center" id="hero-content">
            <div className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100/20 backdrop-blur-sm text-gray-200 rounded-full text-xs font-medium mb-4 sm:mb-6 md:mb-8 border border-gray-300/30">
              <StarIcon className="w-3 h-3 mr-1.5 sm:mr-2 text-gray-300" />
              <span className="hidden sm:inline">Your Learning. Your Schedule. No Limits.</span>
              <span className="sm:hidden">Your Learning. Your Schedule. No Limits.</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 md:mb-8 leading-tight px-2 sm:px-4 md:px-6 font-hero-mix" style={{ lineHeight: '1.1' }}>
              The Way You Learn{' '}
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Deserves Better.
              </span>
              <br />
              <span className="text-white">
                So We Built Better.
              </span>
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 md:mb-10 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-4 sm:px-6" style={{ 
              fontFamily: 'Suisse Intl, Arial, sans-serif',
              fontSize: '16px',
              color: '#e5e7eb',
              fontStyle: 'italic'
            }}>
              Tuttora — Because learning is better together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10 md:mb-12 px-4 sm:px-6">
              <Link href="/auth/register" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 rounded-xl text-xs sm:text-sm md:text-base font-semibold hover:bg-white/30 transition-colors flex items-center justify-center font-suisse-garamond whitespace-nowrap">
                Start Learning Together
                <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Link>
              <Link href="#how-it-works" className="text-white px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 rounded-xl text-xs sm:text-sm md:text-base font-semibold hover:text-blue-300 transition-colors flex items-center justify-center font-suisse-garamond whitespace-nowrap">
                See How It Works
                <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Link>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6">
              <div className="text-center group hover:scale-105 transition-transform duration-300 cursor-pointer">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-300 mb-2 relative font-suisse">
                  <AnimatedCounter target={2} duration={1500} className="inline-block" />
                  <span className="ml-1">Modes</span>
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div className="text-gray-200 group-hover:text-blue-300 transition-colors duration-300 text-xs sm:text-sm md:text-base font-suisse">Community & On-Demand</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform duration-300 cursor-pointer">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-300 mb-2 relative font-suisse">
                  <AnimatedCounter target={100} duration={2000} suffix="%" className="inline-block" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-gray-200 group-hover:text-blue-300 transition-colors duration-300 text-xs sm:text-sm md:text-base font-suisse">Academic Integrity</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform duration-300 cursor-pointer">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-300 mb-2 relative font-suisse">
                  <AnimatedCounter target={24} duration={1000} className="inline-block" />
                  <span className="mx-1">/</span>
                  <AnimatedCounter target={7} duration={1000} className="inline-block" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-purple-400 rounded-full animate-bounce"></div>
                </div>
                <div className="text-gray-200 group-hover:text-blue-300 transition-colors duration-300 text-xs sm:text-sm md:text-base font-suisse">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
              <section className="py-12 sm:py-16 md:py-20 relative z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/landing/section/whitesection.jpg)' }}>
        {/* White overlay to lighten the image */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            {/* Left: Dynamic Visual Content */}
            <div className="w-full lg:w-3/5 order-2 lg:order-1">
              <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/images/landing/features/typing.jpg"
                  alt="Typing feature"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Right: Interactive Accordion */}
            <div className="w-full lg:w-2/5 order-1 lg:order-2 mb-8 lg:mb-0">
              <h2 
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 leading-tight text-center lg:text-left"
                style={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  color: '#1f2937',
                  fontWeight: '700'
                }}
              >
                <div className="block">Your Path to</div>
                <div className="block">Academic Success</div>
              </h2>
              
              <InteractiveAccordion
                items={[
                  {
                    id: 'ask',
                    title: 'Ask',
                    description: 'Easily submit questions, set urgency, and share your learning style to get the support you need, when you need it.',
                    buttonText: 'Submit request',
                    buttonLink: '/auth/register'
                  },
                  {
                    id: 'match',
                    title: 'Match',
                    description: 'Get instantly paired with the right peer tutor based on subject, availability, and your preferences—no waiting required.',
                    buttonText: 'Find your tutor',
                    buttonLink: '/auth/register'
                  },
                  {
                    id: 'earn',
                    title: 'Earn',
                    description: 'Share your expertise, build your reputation, and get paid for helping others succeed, all on your own schedule.',
                    buttonText: 'Start tutoring',
                    buttonLink: '/auth/register'
                  }
                ]}
              />
            </div>
          </div>
        </div>
        

      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 px-4 leading-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              How the Hybrid Model Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-3xl mx-auto px-4 leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              Choose your path: build community through free peer support, or access premium on-demand help when you need it most.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
            {/* Community Mode */}
            <div className="p-8 rounded-2xl border-2 border-green-400/60">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                  <HeartIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Free Mode
                  </h3>
                  <p 
                    className="font-medium text-sm sm:text-base" 
                    style={{ 
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      color: '#dcfce7',
                      fontWeight: '600'
                    }}
                  >
                    Access for Everyone
                  </p>
                </div>
              </div>
              
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Join as Rookies (seeking help) or Tutos (offering help)
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Browse and answer questions in Forum
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Earn Tpoints for helpful answers, accepted solutions, or referrals
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Climb the leaderboard and build your reputation
                  </span>
                </li>
              </ul>

              <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-lg border border-green-400/40">
                <p 
                  className="text-sm font-medium" 
                  style={{ 
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    color: '#dcfce7',
                    fontWeight: '600'
                  }}
                >
                  <strong>Why it matters:</strong> Keeps support accessible to all students while fostering a positive academic culture.
                </p>
              </div>
            </div>

            {/* On-Demand Mode */}
            <div className="p-8 rounded-2xl border-2 border-blue-400/60">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                  <BoltIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Premium Mode
                  </h3>
                  <p 
                    className="font-medium text-sm sm:text-base" 
                    style={{ 
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      color: '#dbeafe',
                      fontWeight: '600'
                    }}
                  >
                    Upgrade your impact and your earnings
                  </p>
                </div>
              </div>
              
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Rookies purchase Tpoints to post Tuto match requests
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Direct message access to Tutos who've helped them before
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Tutos earn Tpoints after successful sessions
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    Cash out at a payout threshold or checkpoint (e.g., 100 Tp = $10)
                  </span>
                </li>
                
              </ul>

              <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-lg border border-blue-400/40">
                <p 
                  className="text-sm font-medium" 
                  style={{ 
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    color: '#dbeafe',
                    fontWeight: '600'
                  }}
                >
                  <strong>Premium Features:</strong> Unlock paid status after building trust through Community Mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Desktop Only */}
      <section className="hidden lg:block py-12 sm:py-16 md:py-20 relative z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/landing/section/whitesection.jpg)' }}>
        {/* White overlay to lighten the image */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none"></div>
        <div className="w-full relative z-10">
          <div className="text-center mb-12 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#374151'
            }}>
              Students trust Tuttora for smarter support.
            </h2>
            <div className="flex items-center justify-center mb-6">
              <div className="w-8 h-px bg-slate-500"></div>
              <div className="mx-4">
                <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
                <div className="w-1 h-4 bg-slate-500 mx-auto mt-1"></div>
              </div>
              <div className="w-8 h-px bg-slate-500"></div>
            </div>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto" style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#6b7280'
            }}>
              Real stories from students who've used Rookie and Tuto to get the help they needed, when they needed it.
            </p>
          </div>

          <div className="relative w-full flex justify-center">
            {/* Carousel Container - Desktop Only */}
            <div className="overflow-hidden lg:w-[1160px] mx-auto">
              <div 
                ref={testimonialsRef}
                className="flex gap-4 overflow-x-auto scroll-smooth testimonials-carousel"
                onMouseEnter={handleTestimonialsMouseEnter}
                onMouseLeave={handleTestimonialsMouseLeave}
              >
                {duplicatedTestimonials.map((testimonial, index) => (
                  <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Testimonials Section - Mobile Only */}
      <section className="block lg:hidden py-12 sm:py-16 relative z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/landing/section/whitesection.jpg)' }}>
        {/* White overlay to lighten the image */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none"></div>
        <div className="w-full relative z-10">
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#374151'
            }}>
              Students trust Tuttora for smarter support.
            </h2>
            <div className="flex items-center justify-center mb-6">
              <div className="w-8 h-px bg-slate-500"></div>
              <div className="mx-4">
                <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
                <div className="w-1 h-4 bg-slate-500 mx-auto mt-1"></div>
              </div>
              <div className="w-8 h-px bg-slate-500"></div>
            </div>
            <p className="text-base sm:text-lg max-w-3xl mx-auto" style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#6b7280'
            }}>
              Real stories from students who've used Rookie and Tuto to get the help they needed, when they needed it.
            </p>
          </div>

          {/* Mobile Carousel Container */}
          <div className="overflow-hidden px-2">
            <div 
              ref={mobileTestimonialsRef}
              className="flex gap-4 overflow-x-auto scroll-smooth testimonials-carousel"
              onMouseEnter={handleTestimonialsMouseEnter}
              onMouseLeave={handleTestimonialsMouseLeave}
            >
              {duplicatedTestimonials.map((testimonial, index) => (
                <TestimonialCard key={`mobile-${testimonial.id}-${index}`} testimonial={testimonial} isMobile />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section id="features" className="relative py-12 sm:py-16 md:py-20 overflow-hidden z-10">
        {/* Content Overlay */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 px-4 leading-tight" style={{ fontFamily: 'Ubuntu, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              Powered by People. Perfected by AI.
            </h2>
            <div className="text-sm sm:text-base md:text-lg text-gray-200 max-w-3xl mx-auto space-y-3 px-4 leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              <p>At Tuttora, we pair top-tier peer tutors with AI that improves every session.</p>
              <p className="font-semibold text-white">Real help for students. Real growth for tutors.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                AI-Moderated Sessions
              </h3>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Every session is guided by smart AI to ensure focus, fairness, and quality.
              </p>
            </div>

            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                <ArrowTrendingUpIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Real-Time Feedback
              </h3>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Tutors get instant insights after each session to continuously improve.
              </p>
            </div>

            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Ethics First
              </h3>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Academic integrity is built into every interaction.
              </p>
            </div>

            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Campus-Ready
              </h3>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Universities can integrate Tuttora as a service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Testimonial Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-cover bg-center bg-no-repeat z-20" style={{ backgroundImage: 'url(/images/landing/section/whitesection.jpg)' }}>
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none"></div>
        
        <div className="relative z-10 container mx-auto px-4">
          {/* Founder Quote */}
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
                            {/* Founder Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden shadow-xl">
                  <Image
                    src="/images/landing/theteam/founder.png"
                    alt="Chukwudi Udechukwu, Founder of Tuttora"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
                            {/* Quote Content */}
              <div className="flex-1 text-center lg:text-left">
                <blockquote className="text-base sm:text-lg lg:text-xl leading-relaxed mb-6 italic px-4 lg:px-0" style={{ 
                  fontFamily: 'Suisse Intl, Arial, sans-serif',
                  color: '#374151'
                }}>
                  "I built Tuttora to make getting academic help as easy as asking a friend. Every student deserves support that is timely, affordable, and without barriers, so Tuttora connects you with qualified Teaching Assistants right when you need them most."
                </blockquote>
                <div className="text-base sm:text-lg" style={{ 
                  fontFamily: 'Suisse Intl, Arial, sans-serif',
                  color: '#6b7280'
                }}>
                  <span className="font-semibold" style={{ color: '#374151' }}>— Chukwudi Udechukwu</span>, Software Engineer
                </div>
              </div>
            </div>
          </div>

          {/* University Partnership */}
          <div className="max-w-4xl mx-auto mt-12 sm:mt-16 lg:mt-20">
          <div className="text-center mb-8 sm:mb-12">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 px-4" style={{ 
                fontFamily: 'Ubuntu, sans-serif',
                color: '#374151'
              }}>
                Trusted by Wesleyan's COMP-112 class
              </h3>
          </div>
          
                        <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl border border-gray-200 mx-4">
              <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
                {/* University Section - Left Side */}
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 text-center lg:text-left flex-1">
                  {/* University Logo */}
                  <div className="flex-shrink-0">
                    <Image
                  src="/images/landing/partnership-logos/wesleyanUniversity.png"
                  alt="Wesleyan University Logo"
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm"
                    />
                  </div>
                  
                  {/* University Info */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 font-semibold mb-1" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
                    From one student to another
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                      "Built by Cardinals, for more than just Cardinals"
                    </p>
              </div>
            </div>
              {/* Professor Advisor - Right Side - Temporarily Hidden
                <div className="flex-shrink-0 text-center lg:mr-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 overflow-hidden">
                    <Image
                      src="/images/landing/theteam/gravity_goldberg.png"
                      alt="Gravity Goldberg"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-600 font-semibold" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
                    Gravity Goldberg
                  </p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                    Professor Advisor
                  </p>
                </div>
              */}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden z-10">
        {/* Content Overlay */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-white px-4 leading-tight" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
            Ready to Transform Your Learning Journey?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto px-4 leading-relaxed" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
            Join thousands of students who are already learning smarter, supporting each other, and growing together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/auth/register" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 rounded-xl text-xs sm:text-sm md:text-base font-semibold hover:bg-white/30 transition-colors flex items-center justify-center font-suisse whitespace-nowrap">
              Start Your Journey
              <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </Link>
            <Link href="/auth/login" className="text-white px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 rounded-xl text-xs sm:text-sm md:text-base font-semibold hover:text-blue-300 transition-colors flex items-center justify-center font-suisse whitespace-nowrap">
              Sign In
              <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-600 text-white py-8 sm:py-12 border-t border-gray-500 z-30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                <Image
                  src="/images/logo/TP_Logo.png"
                  alt="Tuttora"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>Tuttora</h3>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                A better way to learn.
              </p>
              <p className="text-blue-400 text-sm font-medium" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                Learn, Give, Grow.
              </p>
            </div>
            
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-4 text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>Get Started</h4>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                <li><Link href="/auth/register" className="hover:text-blue-400 transition-colors">Sign Up</Link></li>
                <li><Link href="/auth/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
                <li><Link href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Student Guide</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Tuto Guide</Link></li>
              </ul>
            </div>
            
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-4 text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>Our Platform</h4>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Community Mode</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">On-Demand Mode</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Session Management</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Academic Integrity</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">University Partners</Link></li>
              </ul>
            </div>
            
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-4 text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>Support & Legal</h4>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Academic Honor Code</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-500 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-200 text-sm sm:text-base" style={{ fontFamily: 'Suisse Intl, Arial, sans-serif' }}>
            <p>&copy; 2024 Tuttora. Committed to academic excellence and student success.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 