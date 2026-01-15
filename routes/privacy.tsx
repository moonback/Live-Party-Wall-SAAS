import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import TransitionWrapper from '../components/TransitionWrapper';

const PrivacyPolicy = lazy(() => import('../components/rgpd/PrivacyPolicy'));

export const Route = createFileRoute('/privacy')({
  component: PrivacyRoute,
});

function PrivacyRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="slide-left" duration={600}>
        <PrivacyPolicy onBack={() => {
          window.location.href = '/';
        }} />
      </TransitionWrapper>
    </Suspense>
  );
}

