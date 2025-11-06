/**
 * Simple logger utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (this.isDevelopment || level === 'error' || level === 'warn') {
      switch (level) {
        case 'error':
          console.error(logMessage, meta || '');
          break;
        case 'warn':
          console.warn(logMessage, meta || '');
          break;
        case 'info':
          console.info(logMessage, meta || '');
          break;
        case 'debug':
          console.debug(logMessage, meta || '');
          break;
      }
    }
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }
}

export const logger = new Logger();

