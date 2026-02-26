export enum AnalyticsErrorType {
  DELETED = "DELETED",
  UNAUTHORIZED = "UNAUTHORIZED",
  RATE_LIMITED = "RATE_LIMITED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  UNKNOWN = "UNKNOWN",
}

export class SocialMediaAnalyticsError extends Error {
  constructor(
    public type: AnalyticsErrorType,
    message: string,
    public originalError?: any,
  ) {
    super(message);
    this.name = "SocialMediaAnalyticsError";
  }
}
