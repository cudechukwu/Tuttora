import { useState, useEffect, useCallback } from 'react';

interface ActionItem {
  id: string;
  text: string;
  checked?: boolean;
}

export function useSessionSummary(sessionId: string, token: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [source, setSource] = useState<'ai' | 'human' | 'imported' | 'scripted'>('ai');

  useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      // If no sessionId or token, show mock summary
      if (!sessionId || !token) {
        setSummary('This is a mock AI-generated summary of your tutoring session. You discussed integration by parts, solved two practice problems, and clarified the difference between definite and indefinite integrals.');
        setActionItems([
          { id: '1', text: 'Review integration by parts notes', checked: false },
          { id: '2', text: 'Complete practice set #3', checked: false },
          { id: '3', text: 'Ask about substitution method next session', checked: false },
        ]);
        setKeyConcepts(['Integration by Parts', 'Definite Integrals', 'Practice Problems']);
        setSource('ai');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/ai/sessions/${sessionId}/summary`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch summary');
        const data = await res.json();
        if (cancelled) return;
        setSummary(data.summary || '');
        setActionItems(data.actionItems || []);
        setKeyConcepts(data.keyConcepts || []);
        setSource(data.source || 'ai');
      } catch (err: any) {
        // On error, show mock summary
        setSummary('This is a mock AI-generated summary of your tutoring session. You discussed integration by parts, solved two practice problems, and clarified the difference between definite and indefinite integrals.');
        setActionItems([
          { id: '1', text: 'Review integration by parts notes', checked: false },
          { id: '2', text: 'Complete practice set #3', checked: false },
          { id: '3', text: 'Ask about substitution method next session', checked: false },
        ]);
        setKeyConcepts(['Integration by Parts', 'Definite Integrals', 'Practice Problems']);
        setSource('ai');
        setError('Failed to fetch summary, showing mock data.');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
    return () => { cancelled = true; };
  }, [sessionId, token]);

  const submitFeedback = useCallback((rating: 'up' | 'down') => {
    setFeedback(rating);
    // Optionally: POST feedback to API here
  }, []);

  return { loading, error, summary, actionItems, keyConcepts, source, feedback, setFeedback };
} 