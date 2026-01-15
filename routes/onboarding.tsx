import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import TransitionWrapper from '../components/TransitionWrapper';

const UserOnboarding = lazy(() => import('../components/UserOnboarding'));

export const Route = createFileRoute('/onboarding')({
  component: OnboardingRoute,
});

function OnboardingRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="scale" duration={600}>
        <UserOnboarding
          onComplete={(userName, avatarUrl) => {
            // Après onboarding, rediriger vers la landing
            window.location.href = '/';
          }}
          onBack={() => {
            window.location.href = '/';
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

