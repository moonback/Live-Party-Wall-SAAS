import { createRouter, RouterProvider as TanStackRouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Créer le router avec toutes les routes
// Vérifier que routeTree est bien défini avant de créer le router
if (!routeTree) {
  throw new Error('routeTree is not defined. Please regenerate routeTree.gen.ts');
}

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

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

