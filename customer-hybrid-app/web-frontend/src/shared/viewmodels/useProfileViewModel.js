'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { saveStoredProfile, useStoredProfile } from '@/shared/models/customerStore';
import { sendToNative } from '@/shared/lib/nativeBridge';
import { useIsNativeShell } from '@/shared/lib/useIsNativeShell';

export function useProfileViewModel() {
  const router = useAppRouter();
  // Read straight from the shared store: the profile is on screen in the first render
  const profile = useStoredProfile();
  const isNativeShell = useIsNativeShell();
  const [activeSubView, setActiveSubView] = useState('MAIN'); // 'MAIN' | 'ADDRESSES' | 'GST'

  useEffect(() => {
    if (typeof window !== 'undefined') window.nextRouter = router;
    sendToNative('PAGE_VIEWED', { page: 'profile' });
    sendToNative('WEB_READY', { status: 'ready', page: 'profile' });
  }, [router]);

  const [activeModal, setActiveModal] = useState(null); // null | 'EDIT_PROFILE' | 'ADDRESSES' | 'GST' | 'WALLET' | 'MEMBERSHIP' | 'HELP'


  const handleUpdateProfile = useCallback((updates) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    saveStoredProfile(updated);
    setActiveModal(null);
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
  }, [profile]);

  const handleSelectDefaultAddress = useCallback((addressId) => {
    if (!profile) return;
    const updated = {
      ...profile,
      savedAddresses: profile.savedAddresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      })),
    };
    saveStoredProfile(updated);
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
  }, [profile]);

  const navigateToOrders = useCallback(() => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    router.push('/orders?native=1');
  }, [router]);

  const handleLogout = useCallback(() => {
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
  }, []);

  return {
    profile,
    isNativeShell,
    activeModal,
    setActiveModal,
    handleUpdateProfile,
    handleSelectDefaultAddress,
    navigateToOrders,
    handleLogout,
    goBack: () => router.push('/?native=1'),
  };
}
