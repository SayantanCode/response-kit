export interface ResponseConfig {
  successKey: string;
  messageKey: string;
  dataKey: string;
  errorKey: string;
  codeKey: string;
  defaultStatusCodes: Record<string, number>;
  enableLogs: boolean;
  showStack: boolean;
  logger: Console;
  pagination?: {
    enabled?: boolean; // globally disable pagination
    keys?: {
      total?: string;
      page?: string;
      limit?: string;
      totalPages?: string;
      hasNextPage?: string;
      hasPrevPage?: string;
      nextCursor?: string;
    };
  };
}
