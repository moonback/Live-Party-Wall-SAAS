import { createRouter, RouterProvider as TanStackRouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Vérifier que routeTree est bien défini
if (!routeTree) {
  throw new Error('routeTree is not defined. Please regenerate routeTree.gen.ts');
}

// Créer le router une seule fois au niveau du module
// Utiliser une fonction pour éviter les problèmes d'initialisation avec React 19
const createAppRouter = () => {
  return createRouter({ 
    routeTree,
    defaultPreload: 'intent',
  });
};

// Créer l'instance du router
const router = createAppRouter();

// Déclarer les types pour TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Composant RouterProvider qui sera utilisé dans index.tsx
export const RouterProvider = () => {
  return <TanStackRouterProvider router={router} />;
};

