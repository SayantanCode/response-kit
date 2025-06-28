// File: src/responseHandler.ts

import { Request, Response, NextFunction } from "express";

import { ResponseConfig } from "./types/response"

// extend express Response interface
declare global {
  namespace Express {
    interface Response {
      success: (
        data: any,
        message?: string,
        statusCode?: number,
        meta?: any
      ) => void;
      created: (data: any, message?: string, meta?: any) => void;
      updated: (data: any, message?: string, meta?: any) => void;
      deleted: (message?: string, statusCode?: number) => void;
      error: (message?: string, statusCode?: number, errors?: any[]) => void;
      failValidation: (errors?: any[], message?: string) => void;
      notFound: (message?: string) => void;
      unauthorized: (message?: string) => void;
    }
  }
}

// export interface PaginatedResult<T> {
//   data: T;
//   meta: any;
// }

// import { paginateArray, paginateQuery, paginateCursor } from "./utils/paginate";

let config: ResponseConfig = {
  successKey: "success",
  messageKey: "message",
  dataKey: "data",
  errorKey: "errors",
  codeKey: "code",
  defaultStatusCodes: {
    success: 200,
    created: 201,
    error: 500,
    validation: 422,
    unauthorized: 401,
    notFound: 404,
  },
  enableLogs: false,
  showStack: true,
  logger: console,
  pagination: {
    enabled: true,
    keys: {
      total: "total",
      page: "page",
      limit: "limit",
      totalPages: "totalPages",
      hasNextPage: "hasNextPage",
      hasPrevPage: "hasPrevPage",
      nextCursor: "nextCursor",
    },
  },
};

const getCleanStack = (): string => {
  const raw = new Error().stack?.split("\n").slice(2) || [];
  return raw
    .filter(
      (line) =>
        !line.includes("node_modules") && !line.includes("responseHandler")
    )
    .join("\n");
};

/**
 * Configure the response handler with custom settings.
 * @param {Partial<ResponseConfig>} userConfig - User-defined configuration options.
 */
export const configureResponse = (userConfig: Partial<ResponseConfig> = {}) => {
  config = {
    ...config,
    ...userConfig,
    defaultStatusCodes: {
      ...config.defaultStatusCodes,
      ...(userConfig.defaultStatusCodes || {}),
    },
  };
};

/**
 * Checks if an input is an object style configuration
 * i.e. if it has a truthy value for either the dataKey or messageKey
 * @param {any} input - Input to check
 * @returns {boolean} True if input is an object style configuration, false otherwise
 */
const isObjectStyle = (input: any): boolean =>
  (typeof input === "object" &&
    !Array.isArray(input) &&
    input !== null &&
    Object.prototype.hasOwnProperty.call(input, config.dataKey)) ||
  Object.prototype.hasOwnProperty.call(input, config.messageKey);

const buildResponse = (
  success: boolean,
  message: string,
  data: any = null,
  code: number,
  meta?: any
) => {
  const response: Record<string, any> = {
    [config.successKey]: success,
    [config.messageKey]: message,
    [config.dataKey]: data,
    [config.codeKey]: code,
  };

  if (meta && config.pagination?.enabled !== false) {
    const keyMap = config.pagination?.keys || {};
    const mappedMeta: Record<string, any> = {};

    Object.entries(meta).forEach(([key, value]) => {
      const mappedKey = keyMap[key as keyof typeof keyMap] || key;
      mappedMeta[mappedKey] = value;
    });

    response.meta = mappedMeta;
  }

  return response;
};

export const responseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //   res.success = (
  //     data: any,
  //     message = "Success",
  //     statusCode?: number,
  //     meta?: any
  //   ) => {
  //     const code = statusCode || config.defaultStatusCodes.success;
  //     const response: Record<string, any> = {
  //       [config.successKey]: true,
  //       [config.messageKey]: message,
  //       [config.dataKey]: data,
  //       [config.codeKey]: code,
  //     };
  //     if (meta) response.meta = meta;
  //     if (config.enableLogs) config.logger.log("✅ Success:", response);
  //     res.status(code).json(response);
  //   };

  /**
   * Sends a successful JSON response.
   *
   * @param {any} data - The data to be included in the response.
   * @param {string} [message="Success"] - A message describing the success.
   * @param {number} [statusCode] - The HTTP status code for the response. Defaults to the configured success code.
   * @param {any} [meta] - Optional metadata to include in the response. If pagination is enabled, pagination keys will be mapped.
   * @example
   * res.success({ id: 1, name: "Item" }, "Item data found ", 200, {
   */

  res.success = function (
    dataOrOptions: any,
    message?: string,
    statusCode?: number,
    meta?: any
  ) {
    let data: any;
    let code = statusCode || config.defaultStatusCodes.success;
    let finalMessage = message ?? "Success";
    let finalMeta = meta;

    if (isObjectStyle(dataOrOptions)) {
      const opts = dataOrOptions;
      data = opts[config.dataKey];
      finalMessage = opts[config.messageKey] ?? finalMessage;
      code = opts[config.codeKey] ?? code;
      finalMeta = opts.meta;
    } else {
      data = dataOrOptions;
    }

    const response = buildResponse(true, finalMessage, data, code, finalMeta);
    if (config.enableLogs) config.logger.log("✅ Success:", response);
    res.status(code).json(response);
  };

  /**
   * Sends a successful JSON response for a created resource.
   *
   * @param {any} data - The created data to be included in the response.
   * @param {string} [message="Created"] - A message describing the creation.
   * @param {any} [meta] - Optional metadata to include in the response. If pagination is enabled, pagination keys will be mapped.
   * @example
   * res.created({ id: 1, name: "Item" }, "Item created successfully", {
   *   totalPages: 2,
   *   hasNextPage: true
   * });
   * @output { success: true, message: "Item created successfully", data: { id: 1, name: "Item" }, meta: { totalPages: 2, hasNextPage: true }, code: 201 }
   */
  res.created = function (dataOrOptions: any, message = "Created", meta?: any) {
    let data: any;
    let code = config.defaultStatusCodes.created;
    let finalMessage = message;
    let finalMeta = meta;

    if (isObjectStyle(dataOrOptions)) {
      const opts = dataOrOptions;
      data = opts[config.dataKey];
      finalMessage = opts[config.messageKey] ?? message;
      finalMeta = opts.meta;
      code = opts[config.codeKey] ?? code;
    } else {
      data = dataOrOptions;
    }

    const response = buildResponse(true, finalMessage, data, code, finalMeta);
    if (config.enableLogs) config.logger.log("✅ Created:", response);
    res.status(code).json(response);
  };

  res.updated = function (dataOrOptions: any, message = "Updated", meta?: any) {
    let data: any;
    let code = config.defaultStatusCodes.success;
    let finalMessage = message;
    let finalMeta = meta;

    if (isObjectStyle(dataOrOptions)) {
      const opts = dataOrOptions;
      data = opts[config.dataKey];
      finalMessage = opts[config.messageKey] ?? message;
      finalMeta = opts.meta;
      code = opts[config.codeKey] ?? code;
    } else {
      data = dataOrOptions;
    }

    const response = buildResponse(true, finalMessage, data, code, finalMeta);
    if (config.enableLogs) config.logger.log("✅ Updated:", response);
    res.status(code).json(response);
  };

  res.deleted = function (messageOrOptions: any, statusCode?: number) {
    let finalMessage = "Deleted";
    let code = statusCode || config.defaultStatusCodes.success;

    if (typeof messageOrOptions === "object") {
      finalMessage = messageOrOptions[config.messageKey] ?? finalMessage;
      code = messageOrOptions[config.codeKey] ?? code;
    } else if (typeof messageOrOptions === "string") {
      finalMessage = messageOrOptions;
    }

    const response = buildResponse(true, finalMessage, null, code);
    if (config.enableLogs) config.logger.log("🗑️ Deleted:", response);
    res.status(code).json(response);
  };

  /**
   * Sends an error JSON response.
   *
   * @param {string} [message="Error"] - A message describing the error.
   * @param {number} [statusCode] - The HTTP status code for the response. Defaults to the configured error code.
   * @param {any[]} [errors] - Optional error objects to include in the response.
   * @example
   * res.error("Unauthorized", 401, [{ message: "Missing credentials" }]);
   * @output { success: false, message: "Unauthorized", errors: [{ message: "Missing credentials" }], code: 401 }
   */
  res.error = function (
    messageOrOptions: any,
    statusCode?: number,
    errors?: any[]
  ) {
    let finalMessage = "Error";
    let code = statusCode || config.defaultStatusCodes.error;
    let errorList: any[] = errors || [];
    const stackTrace = getCleanStack();

    if (typeof messageOrOptions === "object") {
      finalMessage = messageOrOptions[config.messageKey] ?? finalMessage;
      code = messageOrOptions[config.codeKey] ?? code;
      errorList = messageOrOptions[config.errorKey] || errorList;
    } else if (typeof messageOrOptions === "string") {
      finalMessage = messageOrOptions;
    }

    const response: Record<string, any> = {
      [config.successKey]: false,
      [config.messageKey]: finalMessage,
      [config.errorKey]: errorList,
      [config.codeKey]: code,
    };

    if (config.showStack) response.stack = stackTrace;
    if (config.enableLogs) config.logger.error("❌ Error:", response);
    res.status(code).json(response);
  };

  res.failValidation = function (
    errorsOrOptions: any,
    message = "Validation failed"
  ) {
    let code = config.defaultStatusCodes.validation;
    let errorList: any[] = [];
    let finalMessage = message;
    const stackTrace = getCleanStack();

    if (isObjectStyle(errorsOrOptions)) {
      const opts = errorsOrOptions;
      errorList = opts[config.errorKey] || [];
      finalMessage = opts[config.messageKey] ?? finalMessage;
      code = opts[config.codeKey] ?? code;
    } else if (Array.isArray(errorsOrOptions)) {
      errorList = errorsOrOptions;
    }

    const response: Record<string, any> = {
      [config.successKey]: false,
      [config.messageKey]: finalMessage,
      [config.errorKey]: errorList,
      [config.codeKey]: code,
    };

    if (config.showStack) response.stack = stackTrace;
    if (config.enableLogs) config.logger.warn("⚠️ Validation:", response);
    res.status(code).json(response);
  };

  res.failValidation = function (
    errorsOrOptions: any,
    message = "Validation failed"
  ) {
    let code = config.defaultStatusCodes.validation;
    let errorList: any[] = [];
    let finalMessage = message;
    const stackTrace = getCleanStack();

    if (isObjectStyle(errorsOrOptions)) {
      const opts = errorsOrOptions;
      errorList = opts[config.errorKey] || [];
      finalMessage = opts[config.messageKey] ?? finalMessage;
      code = opts[config.codeKey] ?? code;
    } else if (Array.isArray(errorsOrOptions)) {
      errorList = errorsOrOptions;
    }

    const response: Record<string, any> = {
      [config.successKey]: false,
      [config.messageKey]: finalMessage,
      [config.errorKey]: errorList,
      [config.codeKey]: code,
    };

    if (config.showStack) response.stack = stackTrace;
    if (config.enableLogs) config.logger.warn("⚠️ Validation:", response);
    res.status(code).json(response);
  };

  res.notFound = function (messageOrOptions: any) {
    let finalMessage = "Not Found";
    const code = config.defaultStatusCodes.notFound;
    const stackTrace = getCleanStack();

    if (typeof messageOrOptions === "object") {
      finalMessage = messageOrOptions[config.messageKey] ?? finalMessage;
    } else if (typeof messageOrOptions === "string") {
      finalMessage = messageOrOptions;
    }

    const response: Record<string, any> = {
      [config.successKey]: false,
      [config.messageKey]: finalMessage,
      [config.codeKey]: code,
    };

    if (config.showStack) response.stack = stackTrace;
    if (config.enableLogs) config.logger.warn("🛑 Not Found:", response);
    res.status(code).json(response);
  };

  next();
};

export const fallbackErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code = config.defaultStatusCodes.error;
  const stackTrace = getCleanStack();
  const response: Record<string, any> = {
    [config.successKey]: false,
    [config.messageKey]: err.message || "Unhandled Error",
    [config.errorKey]: err.stack ? [err.stack] : [],
    [config.codeKey]: code,
  };
  if (config.showStack) response.stack = stackTrace;
  if (config.enableLogs) config.logger.error("🔥 Fallback Error:", err);
  res.status(code).json(response);
};

// export { paginateArray, paginateQuery, paginateCursor };
