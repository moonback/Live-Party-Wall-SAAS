import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import React from 'react';
import { z } from 'zod';
import TransitionWrapper from '../components/TransitionWrapper';
import { useEvent } from '../context/EventContext';
import { isElectron } from '../utils/electronPaths';
import { requireAdminAuth } from '../utils/routeGuards';
import { supabase } from '../services/supabaseClient';

const AdminDashboard = lazy(() => import('../components/AdminDashboard'));
const AdminLogin = lazy(() => import('../components/AdminLogin'));

const adminSearchSchema = z.object({
  event: z.string().optional(),
});

export const Route = createFileRoute('/admin')({
  validateSearch: adminSearchSchema,
  beforeLoad: async () => {
    // Pour /admin, on permet l'accès même si non authentifié (pour afficher le login)
    // Le guard sera géré dans le composant
  },
  component: AdminRoute,
});

function AdminRoute() {
  const { event } = Route.useSearch();
  const { currentEvent, loadEventBySlug } = useEvent();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Vérifier l'authentification
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (event && event !== currentEvent?.slug) {
      loadEventBySlug(event);
    }
  }, [event, currentEvent?.slug, loadEventBySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TransitionWrapper type="scale" duration={600}>
        {isAuthenticated ? (
          <AdminDashboard
            onBack={() => {
              if (isElectron()) {
                return;
              }
              navigate({ to: '/', search: event ? { event } : undefined });
            }}
          />
        ) : (
          <AdminLogin
            onLoginSuccess={() => {
              setIsAuthenticated(true);
            }}
            onBack={() => {
              if (isElectron()) {
                return;
              }
              navigate({ to: '/', search: event ? { event } : undefined });
            }}
          />
        )}
      </TransitionWrapper>
    </Suspense>
  );
}

