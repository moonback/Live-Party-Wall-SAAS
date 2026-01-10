/**
 * Utilitaires pour la gestion des sessions (soirées)
 * pour les événements permanents
 */

/**
 * Retourne la date du jour au format YYYY-MM-DD
 * @returns Date au format ISO (YYYY-MM-DD)
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Détecte si on est en soirée (après 18h)
 * @returns true si l'heure actuelle est après 18h
 */
export const isEveningTime = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 18;
};

/**
 * Logique de reprise automatique de l'affichage ambiant
 * Reprend si on est en soirée (après 18h) ou si on est le weekend
 * @returns true si l'affichage ambiant devrait reprendre automatiquement
 */
export const shouldResumeAmbientDisplay = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = dimanche, 6 = samedi
  
  // Reprendre si on est en soirée (après 18h)
  if (hour >= 18) {
    return true;
  }
  
  // Reprendre si on est le weekend (samedi ou dimanche)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  
  return false;
};

/**
 * Formate une date pour l'affichage (ex: "Vendredi 12 janvier")
 * @param dateString - Date au format YYYY-MM-DD
 * @returns Date formatée en français
 */
export const formatSessionDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  };
  return date.toLocaleDateString('fr-FR', options);
};

/**
 * Formate une date pour l'affichage court (ex: "12/01/2026")
 * @param dateString - Date au format YYYY-MM-DD
 * @returns Date formatée en format court
 */
export const formatSessionDateShort = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

