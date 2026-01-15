import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { useSettings } from '../context/SettingsContext';

const CollageMode = lazy(() => import('../components/CollageMode'));

const collageSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/collage')({
  validateSearch: collageSearchSchema,
  component: CollageRoute,
});

function CollageRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { settings } = useSettings();

  React.useEffect(() => {
    if (event && event !== currentEvent?.slug) {
      loadEventBySlug(event);
    }
  }, [event, currentEvent?.slug, loadEventBySlug]);

  // Vérifier si la fonctionnalité est activée
  if (!settings.collage_mode_enabled) {
    window.location.href = event ? `/guest?event=${event}` : '/guest';
    return null;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="slide-right" duration={600}>
        <CollageMode
          onCollageUploaded={() => {
            window.location.href = event ? `/gallery?event=${event}` : '/gallery';
          }}
          onBack={() => {
            window.location.href = event ? `/guest?event=${event}` : '/guest';
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

