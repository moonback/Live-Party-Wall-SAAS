import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { requireUserRegistration } from '../utils/routeGuards';

const GuestGallery = lazy(() => import('../components/GuestGallery'));

const gallerySearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/gallery')({
  validateSearch: gallerySearchSchema,
  beforeLoad: () => {
    requireUserRegistration();
  },
  component: GalleryRoute,
});

function GalleryRoute() {
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
        <GuestGallery
          onBack={() => {
            navigate({ to: '/', search: event ? { event } : undefined });
          }}
          onUploadClick={() => {
            navigate({ to: '/guest', search: event ? { event } : undefined });
          }}
          onFindMeClick={() => {
            navigate({ to: '/findme', search: event ? { event } : undefined });
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

