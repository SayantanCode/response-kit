export interface IResponseConfig {
  safeInput: boolean; // globally enable safe input
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

export interface SuccessResponseOptions {
  data: any;
  message?: string;
  statusCode?: number;
  meta?: any;
  [key: string]: any; // allow additional properties
}

export interface CreateResponseOptions {
  data?: any;
  message?: string;
  statusCode?: number;
  meta?: any;
}

export interface UpdateResponseOptions {
  data?: any;
  message?: string;
  statusCode?: number;
  meta?: any;
}
export interface DeleteResponseOptions {
  message?: string;
  statusCode?: number;
  meta?: any;
}

export interface ErrorResponseOptions {
  message?: string;
  statusCode?: number;
  error?: any;
  stack?: string;
}

export interface BadRequestResponseOptions {
  message?: string;
  errors?: any[];
}

export interface FailValidationResponseOptions {
  message?: string;
  errors?: any[];
}

export interface NotFoundResponseOptions {
  message?: string;
  errors?: any[];
}

export interface UnauthorizedResponseOptions {
  message?: string;
  errors?: any[];
}