import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { usePhotosQuery } from '../hooks/queries/usePhotosQuery';
import { usePhotosRealtime } from '../hooks/queries/usePhotosRealtime';

const StatsPage = lazy(() => import('../components/StatsPage'));

const statsDisplaySearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/stats-display')({
  validateSearch: statsDisplaySearchSchema,
  component: StatsDisplayRoute,
});

function StatsDisplayRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { data: photos = [] } = usePhotosQuery(currentEvent?.id);
  usePhotosRealtime(currentEvent?.id);

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
      <TransitionWrapper type="fade" duration={500}>
        <StatsPage
          photos={photos}
          isDisplayMode={true}
          onBack={() => {
            window.location.href = event ? `/?event=${event}` : '/';
            window.history.pushState({}, '', window.location.pathname);
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

