/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ShopifyError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'SHOPIFY_ERROR');
    this.name = 'ShopifyError';
  }
}

export class TrelloError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'TRELLO_ERROR');
    this.name = 'TrelloError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error handler middleware for API routes
 */
export function handleError(error: any): {
  error: string;
  code?: string;
  statusCode: number;
  retryAfter?: number;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryAfter: error instanceof RateLimitError ? error.retryAfter : undefined,
    };
  }

  // Default error
  console.error('Unhandled error:', error);
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}

