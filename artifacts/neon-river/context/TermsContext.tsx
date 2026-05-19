import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearTermsRecord, needsTermsAcceptance, saveTermsAcceptance, TERMS_VERSION } from '../lib/termsStorage';

interface TermsContextValue {
  termsAccepted: boolean;
  termsLoaded: boolean;
  termsVersion: string;
  acceptTerms: () => Promise<void>;
  declineTerms: () => Promise<void>;
}

const TermsContext = createContext<TermsContextValue | null>(null);

export function TermsProvider({ children }: { children: React.ReactNode }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsLoaded, setTermsLoaded] = useState(false);

  useEffect(() => {
    needsTermsAcceptance().then(needs => {
      setTermsAccepted(!needs);
      setTermsLoaded(true);
    });
  }, []);

  const acceptTerms = useCallback(async () => {
    await saveTermsAcceptance();
    setTermsAccepted(true);
  }, []);

  const declineTerms = useCallback(async () => {
    await clearTermsRecord();
    setTermsAccepted(false);
  }, []);

  return (
    <TermsContext.Provider value={{ termsAccepted, termsLoaded, termsVersion: TERMS_VERSION, acceptTerms, declineTerms }}>
      {children}
    </TermsContext.Provider>
  );
}

export function useTerms() {
  const ctx = useContext(TermsContext);
  if (!ctx) throw new Error('useTerms must be used inside TermsProvider');
  return ctx;
}
