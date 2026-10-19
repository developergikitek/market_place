'use client';

import React, { Suspense } from 'react';
import { RequirementScreen } from '@/wholesale/components/RequirementScreen';
import { useRequirementViewModel } from '@/wholesale/viewmodels/useRequirementViewModel';

function RequirementContent() {
  const vm = useRequirementViewModel();
  return <RequirementScreen {...vm} />;
}

export default function RequirementPage() {
  return (
    <Suspense fallback={null}>
      <RequirementContent />
    </Suspense>
  );
}
