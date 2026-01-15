import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router';
import { Suspense } from 'react';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { LicenseProvider } from '../context/LicenseContext';
import { EventProvider } from '../context/EventContext';
import { SettingsProvider } from '../context/SettingsContext';
import Toast from '../components/Toast';
import { useToast } from '../context/ToastContext';
import { useLicense } from '../context/LicenseContext';
import { useEvent } from '../context/EventContext';
import LicenseBlock from '../components/LicenseBlock';
import ConsentBanner from '../components/rgpd/ConsentBanner';
import CookiePreferencesModal from '../components/rgpd/CookiePreferences';
import { useState } from 'react';

// Composant pour le contenu de l'app avec les contexts
const AppContent = () => {
  const { toasts, removeToast } = useToast();
  const { isValid: isLicenseValid, loading: licenseLoading } = useLicense();
  const { loading: eventLoading, error: eventError } = useEvent();
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  const router = useRouter();

  return (
    <div className="font-sans min-h-screen text-white relative overflow-hidden">
      {/* Ambient overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.18),transparent_45%)]"></div>
      </div>
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-3 pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map(toast => (
            <Toast 
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-full relative z-10">
        {/* Vérification de la licence - Bloque l'application si expirée */}
        {!licenseLoading && !isLicenseValid && (
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          }>
            <LicenseBlock />
          </Suspense>
        )}

        {/* Afficher un message d'erreur si l'événement n'est pas chargé ou s'il y a une erreur */}
        {eventLoading && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        )}
        
        {eventError && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Erreur de chargement de l'événement</h2>
              <p className="text-gray-300 mb-4">{eventError.message}</p>
              <button
                onClick={() => router.navigate({ to: '/' })}
                className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}

        {!eventLoading && !eventError && isLicenseValid && (
          <>
            <Outlet />
            
            {/* RGPD Consent Banner */}
            <Suspense fallback={null}>
              <ConsentBanner
                onPreferencesClick={() => setShowCookiePreferences(true)}
                onPrivacyClick={() => {
                  router.navigate({ to: '/privacy' });
                }}
              />
            </Suspense>

            {/* Cookie Preferences Modal */}
            {showCookiePreferences && (
              <Suspense fallback={null}>
                <CookiePreferencesModal
                  onClose={() => setShowCookiePreferences(false)}
                  onPrivacyClick={() => {
                    setShowCookiePreferences(false);
                    router.navigate({ to: '/privacy' });
                  }}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const Route = createRootRoute({
  component: () => (
    <ToastProvider>
      <AuthProvider>
        <LicenseProvider>
          <EventProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </EventProvider>
        </LicenseProvider>
      </AuthProvider>
    </ToastProvider>
  ),
  errorComponent: ({ error }) => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Erreur de routage</h2>
          <p className="text-gray-300 mb-4">{error instanceof Error ? error.message : 'Une erreur est survenue'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  },
});

