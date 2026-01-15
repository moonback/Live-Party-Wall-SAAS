import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';

const GuestGallery = lazy(() => import('../components/GuestGallery'));

const gallerySearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/gallery')({
  validateSearch: gallerySearchSchema,
  component: GalleryRoute,
});

function GalleryRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();

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
            window.location.href = event ? `/?event=${event}` : '/';
          }}
          onUploadClick={() => {
            window.location.href = `/guest?event=${event}`;
          }}
          onFindMeClick={() => {
            window.location.href = `/findme?event=${event}`;
          }}
        />
      </TransitionWrapper>
    </Suspense>
  );
}

