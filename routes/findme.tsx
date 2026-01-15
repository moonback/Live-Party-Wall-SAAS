import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { useSettings } from '../context/SettingsContext';
import { requireUserRegistrationAndFeature } from '../utils/routeGuards';
import { getSettings } from '../services/settingsService';

const FindMe = lazy(() => import('../components/FindMe'));

const findmeSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/findme')({
  validateSearch: findmeSearchSchema,
  beforeLoad: () => {
    requireUserRegistration();
    // Le guard de feature sera géré dans le composant
  },
  component: FindMeRoute,
});

function FindMeRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { settings } = useSettings();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (event && event !== currentEvent?.slug) {
      loadEventBySlug(event);
    }
  }, [event, currentEvent?.slug, loadEventBySlug]);

  // Vérifier si la fonctionnalité est activée
  if (!settings.find_me_enabled) {
    navigate({ to: '/gallery', search: event ? { event } : undefined });
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
            navigate({ to: '/gallery', search: event ? { event } : undefined });
          }}
          onPhotoClick={(photo) => {
            navigate({ to: '/gallery', search: event ? { event } : undefined });
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

