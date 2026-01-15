import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { useSettings } from '../context/SettingsContext';

const FindMe = lazy(() => import('../components/FindMe'));

const findmeSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/findme')({
  validateSearch: findmeSearchSchema,
  component: FindMeRoute,
});

function FindMeRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { settings } = useSettings();

  React.useEffect(() => {
    if (event && event !== currentEvent?.slug) {
      loadEventBySlug(event);
    }
  }, [event, currentEvent?.slug, loadEventBySlug]);

  // Vérifier si la fonctionnalité est activée
  if (!settings.find_me_enabled) {
    window.location.href = event ? `/gallery?event=${event}` : '/gallery';
    return null;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="slide-right" duration={600}>
        <FindMe
          onBack={() => {
            window.location.href = event ? `/gallery?event=${event}` : '/gallery';
          }}
          onPhotoClick={(photo) => {
            window.location.href = event ? `/gallery?event=${event}` : '/gallery';
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

