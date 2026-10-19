'use client';

import React from 'react';
import { WholesaleHome } from '@/wholesale/components/WholesaleHome';
import { useWholesaleHomeViewModel } from '@/wholesale/viewmodels/useWholesaleHomeViewModel';

export default function WholesalePage() {
  const vm = useWholesaleHomeViewModel();
  return (
    <WholesaleHome
      requirementCards={vm.requirementCards}
      draftCount={vm.draftCount}
      onCreate={vm.createRequirement}
      onOpenRequirement={vm.openRequirement}
      onTrackOrder={vm.trackOrder}
    />
  );
}
