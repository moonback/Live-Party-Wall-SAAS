/**
 * Gestionnaire centralisé des erreurs Gemini
 * Fournit des fallbacks robustes pour tous les cas d'erreur possibles
 */

import { logger } from './logger';

/**
 * Types d'erreurs Gemini possibles
 */
export enum GeminiErrorType {
  RATE_LIMIT = 'RATE_LIMIT', // 429 - Trop de requêtes
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', // 429 ou erreur de quota
  TIMEOUT = 'TIMEOUT', // Timeout réseau
  NETWORK_ERROR = 'NETWORK_ERROR', // Erreur réseau
  API_UNAVAILABLE = 'API_UNAVAILABLE', // API indisponible (5xx)
  INVALID_RESPONSE = 'INVALID_RESPONSE', // Réponse invalide
  AUTH_ERROR = 'AUTH_ERROR', // Erreur d'authentification (401, 403)
  UNKNOWN = 'UNKNOWN', // Erreur inconnue
}

/**
 * Détecte le type d'erreur Gemini à partir d'une erreur
 * @param error - L'erreur à analyser
 * @returns Le type d'erreur détecté
 */
export function detectGeminiErrorType(error: unknown): GeminiErrorType {
  if (!error) {
    return GeminiErrorType.UNKNOWN;
  }

  // Vérifier si c'est une erreur HTTP avec un status code
  const errorString = error instanceof Error ? error.message : String(error);
  const errorObj = error as { status?: number; statusCode?: number; code?: string };

  // Rate limiting (429)
  if (errorObj.status === 429 || errorObj.statusCode === 429) {
    return GeminiErrorType.RATE_LIMIT;
  }

  // Quota dépassé (peut être 429 ou message spécifique)
  if (
    errorObj.status === 429 ||
    errorObj.statusCode === 429 ||
    errorString.toLowerCase().includes('quota') ||
    errorString.toLowerCase().includes('quota exceeded') ||
    errorString.toLowerCase().includes('rate limit')
  ) {
    return GeminiErrorType.QUOTA_EXCEEDED;
  }

  // Erreurs d'authentification (401, 403)
  if (errorObj.status === 401 || errorObj.statusCode === 401) {
    return GeminiErrorType.AUTH_ERROR;
  }
  if (errorObj.status === 403 || errorObj.statusCode === 403) {
    return GeminiErrorType.AUTH_ERROR;
  }

  // Erreurs serveur (5xx)
  if (
    errorObj.status >= 500 ||
    errorObj.statusCode >= 500 ||
    errorString.toLowerCase().includes('internal server error') ||
    errorString.toLowerCase().includes('service unavailable')
  ) {
    return GeminiErrorType.API_UNAVAILABLE;
  }

  // Timeout
  if (
    errorObj.code === 'ETIMEDOUT' ||
    errorObj.code === 'ECONNABORTED' ||
    errorString.toLowerCase().includes('timeout') ||
    errorString.toLowerCase().includes('timed out')
  ) {
    return GeminiErrorType.TIMEOUT;
  }

  // Erreurs réseau
  if (
    errorObj.code === 'ENOTFOUND' ||
    errorObj.code === 'ECONNREFUSED' ||
    errorObj.code === 'ENETUNREACH' ||
    errorString.toLowerCase().includes('network') ||
    errorString.toLowerCase().includes('connection') ||
    errorString.toLowerCase().includes('fetch failed')
  ) {
    return GeminiErrorType.NETWORK_ERROR;
  }

  // Réponse invalide (JSON parsing, etc.)
  if (
    errorString.toLowerCase().includes('json') ||
    errorString.toLowerCase().includes('parse') ||
    errorString.toLowerCase().includes('invalid response') ||
    error instanceof SyntaxError
  ) {
    return GeminiErrorType.INVALID_RESPONSE;
  }

  return GeminiErrorType.UNKNOWN;
}

/**
 * Log une erreur Gemini avec le contexte approprié
 * @param error - L'erreur à logger
 * @param errorType - Le type d'erreur détecté
 * @param context - Contexte additionnel pour le log
 */
export function logGeminiError(
  error: unknown,
  errorType: GeminiErrorType,
  context?: { component?: string; action?: string; [key: string]: unknown }
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log selon le niveau de sévérité
  if (errorType === GeminiErrorType.QUOTA_EXCEEDED || errorType === GeminiErrorType.RATE_LIMIT) {
    logger.warn(`Gemini ${errorType}: ${errorMessage}`, error, context);
  } else if (errorType === GeminiErrorType.AUTH_ERROR) {
    logger.error(`Gemini ${errorType}: ${errorMessage}`, error, context);
  } else {
    logger.error(`Gemini ${errorType}: ${errorMessage}`, error, context);
  }
}

/**
 * Vérifie si une erreur est récupérable (peut être retentée)
 * @param errorType - Le type d'erreur
 * @returns true si l'erreur est récupérable
 */
export function isRecoverableError(errorType: GeminiErrorType): boolean {
  return (
    errorType === GeminiErrorType.RATE_LIMIT ||
    errorType === GeminiErrorType.TIMEOUT ||
    errorType === GeminiErrorType.NETWORK_ERROR ||
    errorType === GeminiErrorType.API_UNAVAILABLE
  );
}

/**
 * Retourne un message d'erreur utilisateur-friendly selon le type d'erreur
 * @param errorType - Le type d'erreur
 * @returns Message d'erreur lisible
 */
export function getUserFriendlyErrorMessage(errorType: GeminiErrorType): string {
  switch (errorType) {
    case GeminiErrorType.RATE_LIMIT:
      return 'Service temporairement surchargé, veuillez réessayer dans quelques instants';
    case GeminiErrorType.QUOTA_EXCEEDED:
      return 'Quota API dépassé, veuillez contacter le support';
    case GeminiErrorType.TIMEOUT:
      return 'Délai d\'attente dépassé, veuillez réessayer';
    case GeminiErrorType.NETWORK_ERROR:
      return 'Erreur de connexion, vérifiez votre connexion internet';
    case GeminiErrorType.API_UNAVAILABLE:
      return 'Service temporairement indisponible, veuillez réessayer plus tard';
    case GeminiErrorType.AUTH_ERROR:
      return 'Erreur d\'authentification, veuillez contacter le support';
    case GeminiErrorType.INVALID_RESPONSE:
      return 'Réponse invalide du service, veuillez réessayer';
    default:
      return 'Erreur inattendue, veuillez réessayer';
  }
}

