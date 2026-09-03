/**
 * Safe, typed API errors for frontend consumption.
 * Ensures internal credentials, database connections, and stack traces
 * are NEVER displayed to the user.
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly userMessage: string;

  constructor(statusCode: number, code: string, userMessage: string) {
    super(userMessage);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage = userMessage;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromStatus(status: number, rawBody?: string): ApiError {
    switch (status) {
      case 401:
        return new ApiError(401, "UNAUTHORIZED", "Authentication required. Please log in again.");
      case 403:
        return new ApiError(403, "FORBIDDEN", "Access denied. You do not have permission to view or modify this tax record.");
      case 404:
        return new ApiError(404, "NOT_FOUND", "The requested tax record or snapshot was not found.");
      case 422:
        return new ApiError(422, "VALIDATION_ERROR", "Validation failed. Please verify the submitted financial information.");
      case 429:
        return new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait a moment before retrying.");
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(status, "SERVER_ERROR", "The statutory calculation service is temporarily unavailable. Please try again later.");
      default:
        return new ApiError(status, "API_ERROR", "An unexpected error occurred while communicating with the tax calculation service.");
    }
  }

  static networkFailure(err?: any): ApiError {
    return new ApiError(0, "NETWORK_FAILURE", "Unable to reach the tax service. Please check your network connection.");
  }

  static timeout(): ApiError {
    return new ApiError(408, "TIMEOUT", "The tax calculation request timed out. Please try again.");
  }

  static malformedResponse(): ApiError {
    return new ApiError(0, "MALFORMED_RESPONSE", "Received an invalid or unparseable response from the tax engine.");
  }
}