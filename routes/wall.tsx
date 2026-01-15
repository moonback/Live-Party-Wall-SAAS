import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { usePhotosQuery } from '../hooks/queries/usePhotosQuery';
import { usePhotosRealtime } from '../hooks/queries/usePhotosRealtime';
import { requireAdminAuth } from '../utils/routeGuards';
import { supabase } from '../services/supabaseClient';

const WallView = lazy(() => import('../components/WallView'));

const wallSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/wall')({
  validateSearch: wallSearchSchema,
  beforeLoad: async () => {
    // Vérifier l'authentification admin
    const { data: { session } } = await supabase.auth.getSession();
    requireAdminAuth(!!session?.user);
  },
  component: WallRoute,
});

function WallRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { data: photos = [] } = usePhotosQuery(currentEvent?.id);
  usePhotosRealtime(currentEvent?.id);
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
        <WallView
          photos={photos}
          onBack={() => {
            navigate({ to: '/', search: event ? { event } : undefined });
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

