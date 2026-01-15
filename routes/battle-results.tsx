import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';

const BattleResultsProjection = lazy(() => import('../components/BattleResultsProjection'));

const battleResultsSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/battle-results')({
  validateSearch: battleResultsSearchSchema,
  component: BattleResultsRoute,
});

function BattleResultsRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const navigate = useNavigate();

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
        <BattleResultsProjection
          onBack={() => {
            navigate({ to: '/', search: event ? { event } : undefined });
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

