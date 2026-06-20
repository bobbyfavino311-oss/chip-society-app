import { router } from 'expo-router';
import { useEffect } from 'react';

export default function GuestScreen() {
  useEffect(() => { router.replace('/entry'); }, []);
  return null;
}
