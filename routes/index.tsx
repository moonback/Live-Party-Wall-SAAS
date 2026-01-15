import { createFileRoute, useNavigate } from '@tanstack/react-router';
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
  const navigate = useNavigate();

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
              navigate({ to: '/admin' });
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
            const eventSlug = currentEvent.slug;
            const modeMap: Record<string, { to: string; search?: { event: string } }> = {
              'guest': { to: '/guest', search: { event: eventSlug } },
              'gallery': { to: '/gallery', search: { event: eventSlug } },
              'wall': { to: '/wall', search: { event: eventSlug } },
              'projection': { to: '/projection', search: { event: eventSlug } },
              'admin': { to: '/admin', search: { event: eventSlug } },
              'mobile-control': { to: '/mobile-control', search: { event: eventSlug } },
              'collage': { to: '/collage', search: { event: eventSlug } },
              'help': { to: '/help' },
              'findme': { to: '/findme', search: { event: eventSlug } },
              'stats-display': { to: '/stats-display', search: { event: eventSlug } },
              'battle-results': { to: '/battle-results', search: { event: eventSlug } },
            };
            const route = modeMap[mode] || { to: '/' };
            navigate(route);
          }}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

