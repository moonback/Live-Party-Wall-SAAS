import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';

const GuestUpload = lazy(() => import('../components/GuestUpload'));

// Validation des search params
const guestSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/guest')({
  validateSearch: guestSearchSchema,
  component: GuestRoute,
});

function GuestRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();

  // Charger l'événement si le paramètre event est présent
  React.useEffect(() => {
    if (event && event !== currentEvent?.slug) {
      loadEventBySlug(event);
    }
  }, [event, currentEvent?.slug, loadEventBySlug]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="slide-right" duration={600}>
        <GuestUpload
          onPhotoUploaded={() => {
            // Navigation sera gérée par TanStack Router
          }}
          onBack={() => {
            window.location.href = event ? `/?event=${event}` : '/';
          }}
          onCollageMode={() => {
            window.location.href = `/collage?event=${event}`;
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

