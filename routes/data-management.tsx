import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import TransitionWrapper from '../components/TransitionWrapper';

const DataManagement = lazy(() => import('../components/rgpd/DataManagement'));

export const Route = createFileRoute('/data-management')({
  component: DataManagementRoute,
});

function DataManagementRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="slide-left" duration={600}>
        <DataManagement onBack={() => {
          window.location.href = '/';
        }} />
      </TransitionWrapper>
    </Suspense>
  );
}

