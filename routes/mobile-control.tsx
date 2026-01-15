import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { requireAdminAuth } from '../utils/routeGuards';
import { supabase } from '../services/supabaseClient';

const MobileControl = lazy(() => import('../components/MobileControl'));

const mobileControlSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/mobile-control')({
  validateSearch: mobileControlSearchSchema,
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    requireAdminAuth(!!session?.user);
  },
  component: MobileControlRoute,
});

function MobileControlRoute() {
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
      <TransitionWrapper type="slide-bottom" duration={600}>
        <MobileControl
          onBack={() => {
            navigate({ to: '/', search: event ? { event } : undefined });
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

