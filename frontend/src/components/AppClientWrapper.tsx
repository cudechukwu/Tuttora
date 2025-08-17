"use client";
import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AIConsentModal from '@/components/AIConsentModal'

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboardingPage = pathname?.startsWith('/onboarding');
  
  // Only fetch user profile if not on onboarding pages
  const { userProfile, fetchUserProfile, loading } = useUser();
  // For demo: mock the consent flag (replace with real field from userProfile.user later)
  const [hasAcceptedAIConsent, setHasAcceptedAIConsent] = useState<boolean | null>(null);

  useEffect(() => {
    if (userProfile) {
      // Handles both { user: {...} } and just { ... }
      const consent = (userProfile as any)?.user?.hasAcceptedAIConsent ?? (userProfile as any)?.hasAcceptedAIConsent ?? false;
      setHasAcceptedAIConsent(consent);
    }
  }, [userProfile]);

  const handleAcceptConsent = async () => {
    // Call backend to set consent
    const token = localStorage.getItem('accessToken');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/ai/consents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feature: 'SESSION_SUMMARY', consented: true }),
    });
    setHasAcceptedAIConsent(true);
    await fetchUserProfile();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Consent Modal blocks app if not accepted */}
      {userProfile && hasAcceptedAIConsent === false && (
        <AIConsentModal isOpen={true} onAccept={handleAcceptConsent} />
      )}
      {children}
    </div>
  );
} 