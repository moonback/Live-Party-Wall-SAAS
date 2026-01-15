import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import TransitionWrapper from '../components/TransitionWrapper';

// Lazy loading components
const Landing = lazy(() => import('../components/Landing'));
const Accueil = lazy(() => import('../components/Accueil'));

const indexSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/')({
  validateSearch: indexSearchSchema,
  component: IndexRoute,
});

function IndexRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { isAuthenticated: isAdminAuthenticated } = useAuth();

  // Charger l'événement si le paramètre event est présent
  React.useEffect(() => {
    if (event && event !== currentEvent?.slug) {
      loadEventBySlug(event);
    }
  }, [event, currentEvent?.slug, loadEventBySlug]);

  // Si pas d'événement, afficher Accueil
  if (!currentEvent) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      }>
        <TransitionWrapper type="fade" duration={500}>
          <Accueil
            onAdminClick={() => {
              // Navigation sera gérée par TanStack Router
              window.location.href = '/admin';
            }}
          />
        </TransitionWrapper>
      </Suspense>
    );
  }

  // Si événement présent, afficher Landing
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="zoom-bounce" duration={800}>
        <Landing 
          onSelectMode={(mode) => {
            // Navigation sera gérée par TanStack Router
            // Pour l'instant, on utilise window.location pour la migration progressive
            const eventSlug = currentEvent.slug;
            const modeMap: Record<string, string> = {
              'guest': `/guest?event=${eventSlug}`,
              'gallery': `/gallery?event=${eventSlug}`,
              'wall': `/wall?event=${eventSlug}`,
              'projection': `/projection?event=${eventSlug}`,
              'admin': `/admin?event=${eventSlug}`,
              'mobile-control': `/mobile-control?event=${eventSlug}`,
              'collage': `/collage?event=${eventSlug}`,
              'help': '/help',
              'findme': `/findme?event=${eventSlug}`,
              'stats-display': `/stats-display?event=${eventSlug}`,
            };
            const url = modeMap[mode] || '/';
            window.location.href = url;
          }}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

