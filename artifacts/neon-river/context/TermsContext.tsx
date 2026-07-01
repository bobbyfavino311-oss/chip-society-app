import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  hasAcceptedCurrentTerms,
  needsTermsPrompt,
  saveTermsAcceptance,
  saveTermsDecline,
  TERMS_VERSION,
} from '../lib/termsStorage';
import { useUser } from './UserContext';

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
  // Local (on-device) record — the historical source of truth. Kept as a fast
  // path / offline fallback for guests who never round-trip through the server.
  const [localAccepted, setLocalAccepted]       = useState(false);
  const [localNeedsPrompt, setLocalNeedsPrompt] = useState(false);
  const [localLoaded, setLocalLoaded]           = useState(false);

  // Server-backed record (profile.termsAcceptedVersion) — the durable source
  // of truth for registered accounts. Fixes the long-standing bug where a
  // reinstall, device swap, or cleared AsyncStorage re-prompted returning
  // players even though they had already accepted the current version.
  const { profile, isLoaded: profileLoaded, updateProfile } = useUser();
  const serverAccepted = profile.termsAcceptedVersion === TERMS_VERSION;

  useEffect(() => {
    Promise.all([hasAcceptedCurrentTerms(), needsTermsPrompt()]).then(
      ([accepted, needsPrompt]) => {
        setLocalAccepted(accepted);
        setLocalNeedsPrompt(needsPrompt);
        setLocalLoaded(true);
      }
    );
  }, []);

  // Server says this account already accepted the current version — backfill
  // the local record so the fast path agrees on subsequent app opens too.
  useEffect(() => {
    if (serverAccepted && !localAccepted) {
      void saveTermsAcceptance();
      setLocalAccepted(true);
      setLocalNeedsPrompt(false);
    }
  }, [serverAccepted, localAccepted]);

  const termsLoaded      = localLoaded && profileLoaded;
  const termsAccepted    = serverAccepted || localAccepted;
  const termsNeedsPrompt = termsLoaded && !serverAccepted && localNeedsPrompt;

  const acceptTerms = useCallback(async () => {
    await saveTermsAcceptance();
    setLocalAccepted(true);
    setLocalNeedsPrompt(false);
    // Persist to the account server-side (immediate, bypasses debounce) so
    // acceptance survives reinstalls and device changes.
    void updateProfile({ termsAcceptedVersion: TERMS_VERSION });
  }, [updateProfile]);

  // Saves a "seen this version" record so the user is NOT re-prompted on
  // their next session. Does NOT clear the record (which would cause re-prompts).
  const declineTerms = useCallback(async () => {
    await saveTermsDecline();
    setLocalAccepted(false);
    setLocalNeedsPrompt(false);
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
