// ==========================================
// Script pour nettoyer le Service Worker problématique
// À coller dans la console du navigateur (F12 > Console)
// ==========================================

(async () => {
  console.log('🧹 Nettoyage du Service Worker...');
  
  // Unregister tous les service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      console.log('❌ Désinstallation:', registration.scope);
      await registration.unregister();
    }
    console.log(`✅ ${registrations.length} service worker(s) désinstallé(s)`);
  }
  
  // Nettoyer le cache
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      console.log('🗑️ Suppression du cache:', name);
      await caches.delete(name);
    }
    console.log(`✅ ${cacheNames.length} cache(s) supprimé(s)`);
  }
  
  console.log('✨ Terminé! Rechargez la page (Ctrl+R)');
})();

