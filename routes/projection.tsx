import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { usePhotosQuery } from '../hooks/queries/usePhotosQuery';
import { usePhotosRealtime } from '../hooks/queries/usePhotosRealtime';

const ProjectionWall = lazy(() => import('../components/ProjectionWall'));
const AdminLogin = lazy(() => import('../components/AdminLogin'));

const projectionSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/projection')({
  validateSearch: projectionSearchSchema,
  component: ProjectionRoute,
});

function ProjectionRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { isAuthenticated: isAdminAuthenticated } = useAuth();
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
        {isAdminAuthenticated ? (
          <ProjectionWall
            photos={photos}
            onBack={() => {
              window.location.href = event ? `/?event=${event}` : '/';
            }}
            displayDuration={5000}
            transitionDuration={1000}
            transitionType="fade"
          />
        ) : (
          <AdminLogin
            onLoginSuccess={() => {
              // Reste sur la même route après login
            }}
            onBack={() => {
              window.location.href = event ? `/?event=${event}` : '/';
            }}
          />
        )}
      </TransitionWrapper>
    </Suspense>
  );
}

