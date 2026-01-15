import { createRouter, RouterProvider as TanStackRouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { useMemo } from 'react';

// Vérifier que routeTree est bien défini
if (!routeTree) {
  throw new Error('routeTree is not defined. Please regenerate routeTree.gen.ts');
}

// Créer le router de manière lazy pour éviter les problèmes d'initialisation avec React 19
let routerInstance: ReturnType<typeof createRouter> | null = null;

const getRouter = () => {
  if (!routerInstance) {
    routerInstance = createRouter({ 
      routeTree,
      defaultPreload: 'intent',
    });
  }
  return routerInstance;
};

// Déclarer les types pour TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

// Composant RouterProvider qui sera utilisé dans index.tsx
export const RouterProvider = () => {
  const router = useMemo(() => getRouter(), []);
  return <TanStackRouterProvider router={router} />;
};

