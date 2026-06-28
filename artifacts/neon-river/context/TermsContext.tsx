import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  hasAcceptedCurrentTerms,
  needsTermsPrompt,
  saveTermsAcceptance,
  saveTermsDecline,
  TERMS_VERSION,
} from '../lib/termsStorage';

interface TermsContextValue {
  termsAccepted: boolean;    // true only when the user actively accepted the current version
  termsNeedsPrompt: boolean; // true when the terms screen should be shown (new install or version bump)
  termsLoaded: boolean;
  termsVersion: string;
  acceptTerms: () => Promise<void>;
  declineTerms: () => Promise<void>;
}

const TermsContext = createContext<TermsContextValue | null>(null);

export function TermsProvider({ children }: { children: React.ReactNode }) {
  const [termsAccepted, setTermsAccepted]         = useState(false);
  const [termsNeedsPrompt, setTermsNeedsPrompt]   = useState(false);
  const [termsLoaded, setTermsLoaded]             = useState(false);

  useEffect(() => {
    Promise.all([hasAcceptedCurrentTerms(), needsTermsPrompt()]).then(
      ([accepted, needsPrompt]) => {
        setTermsAccepted(accepted);
        setTermsNeedsPrompt(needsPrompt);
        setTermsLoaded(true);
      }
    );
  }, []);

  const acceptTerms = useCallback(async () => {
    await saveTermsAcceptance();
    setTermsAccepted(true);
    setTermsNeedsPrompt(false);
  }, []);

  // Saves a "seen this version" record so the user is NOT re-prompted on
  // their next session. Does NOT clear the record (which would cause re-prompts).
  const declineTerms = useCallback(async () => {
    await saveTermsDecline();
    setTermsAccepted(false);
    setTermsNeedsPrompt(false);
  }, []);

  return (
    <TermsContext.Provider
      value={{ termsAccepted, termsNeedsPrompt, termsLoaded, termsVersion: TERMS_VERSION, acceptTerms, declineTerms }}
    >
      {children}
    </TermsContext.Provider>
  );
}

export function useTerms() {
  const ctx = useContext(TermsContext);
  if (!ctx) throw new Error('useTerms must be used inside TermsProvider');
  return ctx;
}
