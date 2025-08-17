import Link from 'next/link';

export const metadata = {
  title: 'Our Story - Tuttora',
  description: 'Discover the personal journey behind Tuttora - built by a student-athlete who experienced the struggle of rigid academic schedules.',
};

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Our Story
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From frustration to innovation — how one student-athlete's struggle with rigid academic schedules 
              became the foundation for a platform that puts students first.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* CEO Image Card */}
            <div className="relative flex flex-col items-center">
              <div className="aspect-square w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white">
                <img
                  src="/images/landing/theteam/Chukwudi_udechukwu.JPG"
                  alt="Chukwudi Udechukwu, CEO & Founder"
                  className="object-cover w-full h-full rounded-2xl shadow-lg"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Chukwudi Udechukwu</h3>
                <p className="text-primary-600 font-semibold">CEO & Founder</p>
                <p className="text-gray-500 text-sm mt-1">Student-Athlete Turned Entrepreneur</p>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full opacity-80"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full opacity-80"></div>
            </div>

            {/* Story Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                  The Problem That Started It All
                </h2>
                <div className="prose prose-lg text-gray-600 space-y-4">
                  <p className="text-lg leading-relaxed">
                    As a student-athlete, I often came back from practice physically drained or missed TA sessions entirely. 
                    I realized that academic help shouldn't require you to bend your life around someone else's schedule.
                  </p>
                  <p className="text-lg leading-relaxed">
                    <strong>Tuttora was built for students like me</strong> — people who need support on their terms, 
                    when they're ready, not when the system is.
                  </p>
                </div>
              </div>

              {/* Key Insights */}
              <div className="grid sm:grid-cols-2 gap-6 mt-12">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rigid Schedules</h3>
                  <p className="text-gray-600 text-sm">Traditional tutoring forces students to adapt to fixed times, ignoring their unique circumstances.</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Community First</h3>
                  <p className="text-gray-600 text-sm">Building a supportive network where students help each other grow together.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our People Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our People
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the team behind Tuttora — passionate individuals dedicated to transforming academic support.
            </p>
          </div>

          {/* Main Team Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Founder & CEO */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                  <img
                    src="/images/landing/theteam/Chukwudi_udechukwu.JPG"
                    alt="Chukwudi Udechukwu"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Chukwudi Udechukwu</h3>
                  <p className="text-gray-600 font-semibold mb-2">Founder & CEO</p>
                  <p className="text-gray-600 text-xs leading-relaxed" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                  President of Tuttora, leading the organization's vision and campus strategy with a focus on technology, growth, and revenue. Oversees product development and institutional collaborations to scale operations and expand market reach.
                  </p>
                </div>
              </div>
            </div>

            {/* Vice President */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                  <img
                    src="/images/landing/theteam/JackLucido.jpeg"
                    alt="Jack Lucido"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Jack Lucido</h3>
                  <p className="text-gray-600 font-semibold mb-2">Vice President</p>
                  <p className="text-gray-600 text-xs leading-relaxed" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                  Vice President, leading partnerships, investment strategy, and campus initiatives to scale Tuttora. Oversees operations and drives execution across programs and institutional outreach.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advisers Section */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Advisers</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Expert guidance from industry leaders and academic professionals.
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-12">
            {/* Marisa McClary */}
            <div className="text-center">
              <div className="w-28 h-28 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-lg mx-auto mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">Marisa McClary</h4>
              <p className="text-gray-600 font-semibold text-sm">Investment Strategy Advisor</p>
            </div>

            {/* Dr. Sarah Johnson */}
            <div className="text-center">
              <div className="w-28 h-28 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-lg mx-auto mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">Dr. Sarah Johnson</h4>
              <p className="text-gray-600 font-semibold text-sm">Educational Technology Advisor</p>
            </div>

            {/* Prof. Michael Chen */}
            <div className="text-center">
              <div className="w-28 h-28 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-lg mx-auto mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">Khai Tran</h4>
              <p className="text-gray-600 font-semibold text-sm">Student Success Advisor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              The Solution We Built
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A dual-mode platform that combines the power of community with the reliability of professional support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Community Mode */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200/50 shadow-xl">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Community Mode</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Free peer-to-peer support that serves as both a training ground and reputation engine. 
                  Students help each other, building skills and credibility along the way.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Flexible scheduling around your life
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Build reputation and skills
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Supportive learning community
                  </li>
                </ul>
              </div>
            </div>

            {/* On-Demand Mode */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200/50 shadow-xl">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">On-Demand Mode</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Premium academic help when you need it most. Professional tutors available 24/7 
                  to provide expert guidance on your schedule.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Professional tutors available 24/7
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Expert guidance on your terms
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Guaranteed quality and reliability
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why This Matters
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our approach isn't just about convenience — it's about creating a system that truly serves students.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Humanizes the Brand</h3>
              <p className="text-gray-600 leading-relaxed">
                This isn't just another tutoring app — it's built from lived frustration with rigid systems.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Attracts Communities</h3>
              <p className="text-gray-600 leading-relaxed">
                Athletes and non-traditional students see themselves in this story and feel understood.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Clarifies Value</h3>
              <p className="text-gray-600 leading-relaxed">
                Flexibility isn't a buzzword here — it's a necessity born from real student struggles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience Academic Support That Works for You?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who've found the flexibility and support they need to succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-2xl hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}