/**
 * Logger structuré pour remplacer console.log/error/warn
 * Les logs sont automatiquement désactivés en production (sauf erreurs)
 * Support pour logging structuré avec contexte
 */

const isDev = import.meta.env.DEV;

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

function formatMessage(level: string, message: string, context?: LogContext, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
  const messageStr = `[${timestamp}] [${level}]${contextStr} ${message}`;
  
  return messageStr as unknown as void;
}

export const logger = {
  /**
   * Log général (désactivé en production)
   */
  log: (message: string, context?: LogContext, ...args: unknown[]) => {
    if (isDev) {
      console.log(formatMessage('LOG', message, context, ...args), ...args);
    }
  },
  
  /**
   * Log d'erreur (toujours actif, même en production)
   * À envoyer à un service de monitoring en production (Sentry, etc.)
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    
    console.error(
      formatMessage('ERROR', message, context),
      errorDetails || '',
      context ? `Context: ${JSON.stringify(context)}` : ''
    );
    
    // TODO: En production, envoyer à Sentry ou service de monitoring
    // if (!isDev && error) {
    //   Sentry.captureException(error, { extra: context });
    // }
  },
  
  /**
   * Log d'avertissement (désactivé en production)
   */
  warn: (message: string, context?: LogContext, ...args: unknown[]) => {
    if (isDev) {
      console.warn(formatMessage('WARN', message, context, ...args), ...args);
    }
  },
  
  /**
   * Log d'information (désactivé en production)
   */
  info: (message: string, context?: LogContext, ...args: unknown[]) => {
    if (isDev) {
      console.info(formatMessage('INFO', message, context, ...args), ...args);
    }
  },
  
  /**
   * Log de debug (désactivé en production)
   */
  debug: (message: string, context?: LogContext, ...args: unknown[]) => {
    if (isDev) {
      console.debug(formatMessage('DEBUG', message, context, ...args), ...args);
    }
  },
};

