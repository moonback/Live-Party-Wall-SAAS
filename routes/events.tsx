import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import TransitionWrapper from '../components/TransitionWrapper';

const EventSelector = lazy(() => import('../components/EventSelector'));

export const Route = createFileRoute('/events')({
  component: EventsRoute,
});

function EventsRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="fade" duration={500}>
        <EventSelector
          onEventSelected={(event) => {
            // Navigation vers la landing avec l'événement
            window.location.href = `/?event=${event.slug}`;
          }}
          onSettingsClick={(event) => {
            // Navigation vers l'admin avec l'événement
            window.location.href = `/admin?event=${event.slug}`;
          }}
          onBack={() => {
            window.location.href = '/';
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

