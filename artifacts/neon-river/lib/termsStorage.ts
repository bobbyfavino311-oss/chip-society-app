import AsyncStorage from '@react-native-async-storage/async-storage';

// Bump this whenever the terms content changes materially.
// All users (new + returning) will be shown the updated terms once.
export const TERMS_VERSION = '2.0';

const STORAGE_KEY = '@chipsociety_terms_v2';

export interface TermsRecord {
  accepted: boolean;
  version: string;
  timestamp: string;
}

export async function getTermsRecord(): Promise<TermsRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TermsRecord;
  } catch {
    return null;
  }
}

export async function saveTermsAcceptance(): Promise<void> {
  const record: TermsRecord = {
    accepted: true,
    version: TERMS_VERSION,
    timestamp: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

// Saves a "seen but not accepted" record for this version so the user
// is not re-prompted on their next session for the same version.
export async function saveTermsDecline(): Promise<void> {
  const record: TermsRecord = {
    accepted: false,
    version: TERMS_VERSION,
    timestamp: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export async function clearTermsRecord(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Returns true when the user needs to be shown the terms screen:
// – No record at all (brand-new install)
// – Stored version is older than the current TERMS_VERSION
// This is version-only — accepted/declined for the *current* version
// does not trigger a re-prompt on the same version.
export async function needsTermsPrompt(): Promise<boolean> {
  const record = await getTermsRecord();
  if (!record) return true;
  return record.version !== TERMS_VERSION;
}

// Returns true only when the user has *actively accepted* the current version.
export async function hasAcceptedCurrentTerms(): Promise<boolean> {
  const record = await getTermsRecord();
  if (!record) return false;
  return record.accepted && record.version === TERMS_VERSION;
}

// Legacy alias — kept for any callers that haven't migrated yet.
export async function needsTermsAcceptance(): Promise<boolean> {
  return needsTermsPrompt();
}
