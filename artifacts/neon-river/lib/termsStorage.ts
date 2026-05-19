import AsyncStorage from '@react-native-async-storage/async-storage';

export const TERMS_VERSION = '1.0';
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

export async function clearTermsRecord(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function needsTermsAcceptance(): Promise<boolean> {
  const record = await getTermsRecord();
  if (!record || !record.accepted) return true;
  if (record.version !== TERMS_VERSION) return true;
  return false;
}
