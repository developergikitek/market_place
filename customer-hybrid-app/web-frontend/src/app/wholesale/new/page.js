'use client';

import React, { Suspense } from 'react';
import { NewRequirementScreen } from '@/wholesale/components/NewRequirementScreen';
import { useNewRequirementViewModel } from '@/wholesale/viewmodels/useNewRequirementViewModel';

function NewRequirementContent() {
  const vm = useNewRequirementViewModel();
  return <NewRequirementScreen {...vm} />;
}

export default function NewRequirementPage() {
  return (
    <Suspense fallback={null}>
      <NewRequirementContent />
    </Suspense>
  );
}
