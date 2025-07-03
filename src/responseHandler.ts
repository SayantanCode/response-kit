// // File: src/responseHandler.ts

// import { Request, Response, NextFunction } from "express";

// import {
//   ResponseConfig,
//   SuccessResponseOptions,
//   CreateResponseOptions,
//   UpdateResponseOptions,
//   DeleteResponseOptions,
//   ErrorResponseOptions,
//   BadRequestResponseOptions,
//   FailValidationResponseOptions,
//   NotFoundResponseOptions,
//   UnauthorizedResponseOptions,
// } from "./interface/response";

// // extend express Response interface
// declare global {
//   namespace Express {
//     interface Response {
//       success: (
//         data: any,
//         message?: string,
//         statusCode?: number,
//         meta?: any
//       ) => void;
//       created: (data?: any, message?: string, meta?: any) => void;
//       updated: (data?: any, message?: string, meta?: any) => void;
//       deleted: (message?: string, statusCode?: number) => void;
//       error: (message?: string, statusCode?: number, errors?: any[]) => void;
//       badRequest: (errors?: any[], message?: string) => void;
//       failValidation: (errors?: any[], message?: string) => void;
//       notFound: (message?: string) => void;
//       unauthorized: (message?: string) => void;
//     }
//   }
// }

// let config: ResponseConfig = {
//   safeInput: true, // globally enable safe input
//   successKey: "success",
//   messageKey: "message",
//   dataKey: "data",
//   errorKey: "errors",
//   codeKey: "statusCode",
//   defaultStatusCodes: {
//     success: 200,
//     created: 201,
//     updated: 200,
//     deleted: 204,
//     error: 500,
//     badRequest: 400,
//     validation: 422,
//     unauthorized: 401,
//     notFound: 404,
//   },
//   enableLogs: false,
//   showStack: true,
//   logger: console,
//   pagination: {
//     enabled: true,
//     keys: {
//       total: "total",
//       page: "page",
//       limit: "limit",
//       totalPages: "totalPages",
//       hasNextPage: "hasNextPage",
//       hasPrevPage: "hasPrevPage",
//       nextCursor: "nextCursor",
//     },
//   },
// };

// const getCleanStack = (): string => {
//   const raw = new Error().stack?.split("\n").slice(2) || [];
//   return raw
//     .filter(
//       (line) =>
//         !line.includes("node_modules") && !line.includes("responseHandler")
//     )
//     .join("\n");
// };

// /**
//  * Configure the response handler with custom settings.
//  * @param {Partial<ResponseConfig>} userConfig - User-defined configuration options.
//  */
// export const configureResponse = (userConfig: Partial<ResponseConfig> = {}) => {
//   config = {
//     ...config,
//     ...userConfig,
//     defaultStatusCodes: {
//       ...config.defaultStatusCodes,
//       ...(userConfig.defaultStatusCodes || {}),
//     },
//   };
// };

// /**
//  * Checks if an input is an object style configuration
//  * i.e. if it has a truthy value for either the dataKey or messageKey
//  * @param {any} input - Input to check
//  * @returns {boolean} True if input is an object style configuration, false otherwise
//  */
// const isObjectStyle = (input: any): boolean =>
//   (typeof input === "object" &&
//     !Array.isArray(input) &&
//     input !== null &&
//     Object.prototype.hasOwnProperty.call(input, config.dataKey)) ||
//   Object.prototype.hasOwnProperty.call(input, config.messageKey);

// const buildResponse = (
//   success: boolean,
//   message: string,
//   data: any = null,
//   code: number,
//   meta?: any
// ) => {
//   const response: Record<string, any> = {
//     [config.successKey]: success,
//     [config.messageKey]: message,
//     [config.dataKey]: data,
//     [config.codeKey]: code,
//   };

//   if (meta && config.pagination?.enabled !== false) {
//     const keyMap = config.pagination?.keys || {};
//     const mappedMeta: Record<string, any> = {};

//     Object.entries(meta).forEach(([key, value]) => {
//       const mappedKey = keyMap[key as keyof typeof keyMap] || key;
//       mappedMeta[mappedKey] = value;
//     });

//     response.meta = mappedMeta;
//   }

//   return response;
// };

// export const responseMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   /**
//    * Sends a successful JSON response.
//    *
//    * This is the primary method for sending successful responses. This method can be used to send any successful response with data.
//    * @param {any|SuccessResponseOptions} dataOrOptions - The data to be included in the response, or an options object.
//    * If an object, it should conform to the {@link SuccessResponseOptions} type.
//    * If a string, it will be treated as the data directly.
//    * @param {string} [message] - A message describing the success. Only used if `dataOrOptions` is not an object.
//    * @param {number} [statusCode] - The HTTP status code for the response. Defaults to the configured success code. Only used if `dataOrOptions` is not an object.
//    * @param {any} [meta] - Optional metadata to include in the response. If pagination is enabled, pagination keys will be mapped. Only used if `dataOrOptions` is not an object.
//    *
//    * @example <caption>Using data directly</caption>
//    * res.success([{ id: 1, name: "Item" }, ...]);
//    *
//    * @example <caption>Using data with a custom message</caption>
//    * res.success([{ id: 1, name: "Item1" }, ...], "All item data found successfully");
//    *
//    * @example <caption>Using the options object</caption>
//    * res.success({ data: [{ id: 1, name: "Item" }, ...], message: "All item data found successfully", statusCode: 200, meta: { pagination: { total: 1 } } });
//    *
//    * @example <caption>Using data with custom message, status code, and meta</caption>
//    * res.success({ id: 1, name: "Item" }, "Item data found ", 200, { pagination: { total: 1 } });
//    */
//   res.success = (
//     dataOrOptions: any,
//     message?: string,
//     statusCode?: number,
//     meta?: any
//   ) => {
//     let data: any;
//     let code = statusCode || config.defaultStatusCodes.success;
//     let finalMessage = message ?? "Success";
//     let finalMeta = meta;

//     if (isObjectStyle(dataOrOptions)) {
//       const opts = dataOrOptions;
//       data = opts[config.dataKey];
//       finalMessage = opts[config.messageKey] ?? finalMessage;
//       code = opts[config.codeKey] ?? code;
//       finalMeta = opts.meta;
//     } else {
//       data = dataOrOptions;
//     }

//     const response = buildResponse(true, finalMessage, data, code, finalMeta);
//     if (config.enableLogs) config.logger.log("✅ Success:", response);
//     res.status(code).json(response);
//   };

//   /**
//    * Sends a successful JSON response for a created resource.
//    *
//    * This is typically used for POST requests where a new resource is created.
//    * @param {any|CreateResponseOptions} dataOrOptions - The data to be included in the response, or an options object.
//    * If an object, it should conform to the {@link CreateResponseOptions} type.
//    * If a string, it will be treated as the data directly.
//    * @param {string} [message] - A message describing the success. Only used if `dataOrOptions` is not an object.
//    * @param {any} [meta] - Optional metadata to include in the response. If pagination is enabled, pagination keys will be mapped. Only used if `dataOrOptions` is not an object.
//    *
//    * @example <caption>Using data directly</caption>
//    * res.created({ id: 1, name: "Item" });
//    *
//    * @example <caption>Using data with a custom message</caption>
//    * res.created({ id: 1, name: "Item" }, "Item created successfully");
//    *
//    * @example <caption>Using the options object</caption>
//    * res.created({ data: { id: 1, name: "Item" }, message: "Item created successfully", statusCode: 201, meta: { pagination: { total: 1 } } });
//    *
//    * @example <caption>Using data with custom message, status code, and meta</caption>
//    * res.created({ id: 1, name: "Item" }, "Item created successfully ", 201, { pagination: { total: 1 } });
//    */
//   res.created = (
//     dataOrOptions: any,
//     message: string = "Created",
//     meta?: any
//   ) => {
//     let data: any;
//     let code = config.defaultStatusCodes.created;
//     let finalMessage = message;
//     let finalMeta = meta;

//     if (isObjectStyle(dataOrOptions)) {
//       const opts = dataOrOptions;
//       data = opts[config.dataKey];
//       finalMessage = opts[config.messageKey] ?? message;
//       finalMeta = opts.meta;
//       code = opts[config.codeKey] ?? code;
//     } else {
//       data = dataOrOptions;
//     }

//     const response = buildResponse(true, finalMessage, data, code, finalMeta);
//     if (config.enableLogs) config.logger.log("✅ Created:", response);
//     res.status(code).json(response);
//   };
//   /**
//    * Sends a successful JSON response for an updated resource.
//    * This is typically used for PUT or PATCH requests where an existing resource is updated.
//    * @param {any|UpdateResponseOptions} dataOrOptions - The data to be included in the response, or an options object.
//    * If an object, it should conform to the {@link UpdateResponseOptions} type.
//    * If a string, it will be treated as the data directly.
//    * @param {string} [message] - A message describing the success. Only used if `dataOrOptions` is not an object.
//    * @param {any} [meta] - Optional metadata to include in the response. If pagination is enabled, pagination keys will be mapped. Only used if `dataOrOptions` is not an object.
//    * @example <caption>Using data directly</caption>
//    * res.updated({ id: 1, name: "Updated Item" });
//    * @example <caption>Using data with a custom message</caption>
//    * res.updated({ id: 1, name: "Updated Item" }, "Item updated successfully");
//    * @example <caption>Using the options object</caption>
//    * res.updated({ data: { id: 1, name: "Updated Item" }, message: "Item updated successfully", statusCode: 200, meta: { pagination: { total: 1 } } });
//    * @example <caption>Using data with custom message, status code, and meta</caption>
//    * res.updated({ id: 1, name: "Updated Item" }, "Item updated successfully", 200, { pagination: { total: 1 } });
//    */
//   res.updated = (
//     dataOrOptions: any,
//     message: string = "Updated",
//     meta?: any
//   ) => {
//     let data: any;
//     let code = config.defaultStatusCodes.success;
//     let finalMessage = message;
//     let finalMeta = meta;

//     if (isObjectStyle(dataOrOptions)) {
//       const opts = dataOrOptions;
//       data = opts[config.dataKey];
//       finalMessage = opts[config.messageKey] ?? message;
//       finalMeta = opts.meta;
//       code = opts[config.codeKey] ?? code;
//     } else {
//       data = dataOrOptions;
//     }

//     const response = buildResponse(true, finalMessage, data, code, finalMeta);
//     if (config.enableLogs) config.logger.log("✅ Updated:", response);
//     res.status(code).json(response);
//   };
//   /**
//    * Sends a successful JSON response indicating a resource has been deleted.
//    * @param {any|DeleteResponseOptions} messageOrOptions - The message to be included in the response, or an options object.
//    * If an object, it should conform to the {@link DeleteResponseOptions} type.
//    * If a string, it will be treated as the message directly.
//    * @param {number} [statusCode] - The HTTP status code to use. Default is 200.
//    * @example <caption>Using a custom message</caption>
//    * res.deleted("Item deleted successfully");
//    * @example <caption>Using the options object</caption>
//    * res.deleted({ message: "Item deleted successfully", statusCode: 200 });
//    */
//   res.deleted = function (messageOrOptions: any, statusCode?: number) {
//     let finalMessage = "Deleted";
//     let code = statusCode || config.defaultStatusCodes.deleted;

//     if (typeof messageOrOptions === "object") {
//       finalMessage = messageOrOptions[config.messageKey] ?? finalMessage;
//       code = messageOrOptions[config.codeKey] ?? code;
//     } else if (typeof messageOrOptions === "string") {
//       finalMessage = messageOrOptions;
//     }

//     const response = buildResponse(true, finalMessage, null, code);
//     if (config.enableLogs) config.logger.log("🗑️ Deleted:", response);
//     res.status(code).json(response);
//   };

//   /**
//    * Sends an error response with a custom message and optional status code and errors.
//    * @param {any|ErrorResponseOptions} messageOrOptions - The message to be included in the response, or an options object.
//    * If an object, it should conform to the {@link ErrorResponseOptions} type.
//    * If a string, it will be treated as the message directly.
//    * @param {number} [statusCode] - The status code to be included in the response. If not provided, the default status code for errors will be used.
//    * @param {any[]} [errors] - An array of errors to be included in the response. If not provided, an empty array will be used.
//    * @example <caption>Using a custom message</caption>
//    * res.error("Something went wrong");
//    * @example <caption>Using a custom message and status code</caption>
//    * res.error("Something went wrong", 500);
//    * @example <caption>Using a custom message, status code, and errors</caption>
//    * res.error("Something went wrong", 500, [{ field: "name", message: "Name is required" }]);
//    * @example <caption>Using the options object</caption>
//    * res.error({ message: "Something went wrong", statusCode: 500, errors: [{ field: "name", message: "Name is required" }] });
//    */
//   res.error = (messageOrOptions: any, statusCode?: number, errors?: any[]) => {
//     let finalMessage = "Error";
//     let code = statusCode || config.defaultStatusCodes.error;
//     let errorList: any[] = errors || [];
//     const stackTrace = getCleanStack();

//     if (typeof messageOrOptions === "object") {
//       finalMessage = messageOrOptions[config.messageKey] ?? finalMessage;
//       code = messageOrOptions[config.codeKey] ?? code;
//       errorList = messageOrOptions[config.errorKey] || errorList;
//     } else if (typeof messageOrOptions === "string") {
//       finalMessage = messageOrOptions;
//     }

//     const response: Record<string, any> = {
//       [config.successKey]: false,
//       [config.messageKey]: finalMessage,
//       [config.errorKey]: errorList,
//       [config.codeKey]: code,
//     };

//     if (config.showStack) response.stack = stackTrace;
//     if (config.enableLogs) config.logger.error("❌ Error:", response);
//     res.status(code).json(response);
//   };
//   /**
//    * Sends a 401 Unauthorized response with a custom message.
//    * @param {string} message - The message to be included in the response.
//    * @param {any[]} [errors] - An array of errors to be included in the response. If not provided, an empty array will be used.
//    * @example <caption>Using a custom message</caption>
//    * res.unauthorized("Unauthorized");
//    * @example <caption>Using a custom message and errors</caption>
//    * res.unauthorized("Unauthorized", [{ field: "email", message: "Email is required" }]);
//    */
//   res.unauthorized = (message?: string, errors: any[] = []) => {
//     const finalMessage = message ?? "Unauthorized";
//     const code = config.defaultStatusCodes.unauthorized;
//     const stackTrace = config.showStack ? getCleanStack() : undefined;

//     const response: Record<string, any> = {
//       [config.successKey]: false,
//       [config.messageKey]: finalMessage,
//       [config.errorKey]: errors,
//       [config.codeKey]: code,
//     };

//     if (stackTrace) response.stack = stackTrace;
//     if (config.enableLogs) config.logger.warn("🚫 Unauthorized:", response);
//     res.status(code).json(response);
//   };
//   /**
//    * Sends a 400 Bad Request response with a list of errors or options.
//    * @param {any|BadRequestResponseOptions} errorsOrOptions - The errors to be included in the response, or an options object.
//    * If an object, it should conform to the {@link BadRequestResponseOptions} type.
//    * If an array, it will be treated as a list of errors.
//    * @param {string} [message] - The message to be included in the response. If not provided, the default message for bad requests will be used.
//    * @example <caption>Using a list of errors</caption>
//    * res.badRequest([{ field: "email", message: "Email is required" }]);
//    * @example <caption>Using an options object</caption>
//    * res.badRequest({ message: "Bad Request", errors: [{ field: "email", message: "Email is required" }] });
//    */
//   res.badRequest = (errorsOrOptions: any, message: string = "Bad Request") => {
//     let code = config.defaultStatusCodes.badRequest;
//     let errorList: any[] = [];
//     let finalMessage = message;
//     const stackTrace = getCleanStack();

//     if (isObjectStyle(errorsOrOptions)) {
//       const opts = errorsOrOptions;
//       errorList = opts[config.errorKey] || [];
//       finalMessage = opts[config.messageKey] ?? finalMessage;
//       code = opts[config.codeKey] ?? code;
//     } else if (Array.isArray(errorsOrOptions)) {
//       errorList = errorsOrOptions;
//     }

//     const response: Record<string, any> = {
//       [config.successKey]: false,
//       [config.messageKey]: finalMessage,
//       [config.errorKey]: errorList,
//       [config.codeKey]: code,
//     };

//     if (config.showStack) response.stack = stackTrace;
//     if (config.enableLogs) config.logger.warn("🚫 Bad Request:", response);
//     res.status(code).json(response);
//   };
//   /**
//    * Sends a 422 Validation Failed response with a list of errors or options.
//    * @param {any|FailValidationResponseOptions} errorsOrOptions - The errors to be included in the response, or an options object.
//    * If an object, it should conform to the {@link FailValidationResponseOptions} type.
//    * If an array, it will be treated as a list of errors.
//    * @param {string} [message] - The message to be included in the response. If not provided, the default message for validation failures will be used.
//    * @example <caption>Using a list of errors</caption>
//    * res.failValidation([{ field: "email", message: "Email is required" }]);
//    * @example <caption>Using an options object</caption>
//    * res.failValidation({ message: "Validation failed", errors: [{ field: "email", message: "Invalid email format" }, { field: "password", message: "Password must be at least 8 characters long" }] });
//    */
//   res.failValidation = (
//     errorsOrOptions: any,
//     message: string = "Validation failed"
//   ) => {
//     let code = config.defaultStatusCodes.validation;
//     let errorList: any[] = [];
//     let finalMessage = message;
//     const stackTrace = getCleanStack();

//     if (isObjectStyle(errorsOrOptions)) {
//       const opts = errorsOrOptions;
//       errorList = opts[config.errorKey] || [];
//       finalMessage = opts[config.messageKey] ?? finalMessage;
//       code = opts[config.codeKey] ?? code;
//     } else if (Array.isArray(errorsOrOptions)) {
//       errorList = errorsOrOptions;
//     }

//     const response: Record<string, any> = {
//       [config.successKey]: false,
//       [config.messageKey]: finalMessage,
//       [config.errorKey]: errorList,
//       [config.codeKey]: code,
//     };

//     if (config.showStack) response.stack = stackTrace;
//     if (config.enableLogs) config.logger.warn("⚠️ Validation:", response);
//     res.status(code).json(response);
//   };
//   /**
//    * Sends a 404 Not Found response with a custom message.
//    * @param {string|NotFoundResponseOptions} messageOrOptions - The message to be included in the response, or an options object.
//    * If an object, it should conform to the {@link NotFoundResponseOptions} type.
//    * If a string, it will be treated as the message directly.
//    * @example <caption>Using a custom message</caption>
//    * res.notFound("Resource not found");
//    * @example <caption>Using the options object</caption>
//    * res.notFound({ message: "Resource not found", statusCode: 404 });
//    */
//   res.notFound = function (messageOrOptions: any) {
//     let finalMessage = "Not Found";
//     const code = config.defaultStatusCodes.notFound;
//     const stackTrace = getCleanStack();

//     if (typeof messageOrOptions === "object") {
//       finalMessage = messageOrOptions[config.messageKey] ?? finalMessage;
//     } else if (typeof messageOrOptions === "string") {
//       finalMessage = messageOrOptions;
//     }

//     const response: Record<string, any> = {
//       [config.successKey]: false,
//       [config.messageKey]: finalMessage,
//       [config.errorKey]: [],
//       [config.codeKey]: code,
//     };

//     if (config.showStack) response.stack = stackTrace;
//     if (config.enableLogs) config.logger.warn("🛑 Not Found:", response);
//     res.status(code).json(response);
//   };

//   next();
// };

// export const fallbackErrorHandler = (
//   err: Error,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const code = config.defaultStatusCodes.error;
//   const stackTrace = getCleanStack();
//   const response: Record<string, any> = {
//     [config.successKey]: false,
//     [config.messageKey]: err.message || "Unhandled Error",
//     [config.errorKey]: err.stack ? [err.stack] : [],
//     [config.codeKey]: code,
//   };
//   if (config.showStack) response.stack = stackTrace;
//   if (config.enableLogs) config.logger.error("🔥 Fallback Error:", err);
//   res.status(code).json(response);
// };

// File: src/responseHandler.ts
import { Request, Response, NextFunction } from "express";

import { IResponseConfig } from "./interface/response";

// Extend express Response interface
declare global {
  namespace Express {
    interface Response {
      /**
       * Send a success response with optional data, message, code, and pagination meta.
       * @param data 
       * @param message 
       * @param statusCode 
       * @param meta 
       * @example <caption>Using data directly</caption>
       * res.success({ id: 1, name: "Item" }, "Item found", 200, { total: 1 });
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.success({ data: { id: 1, name: "Item" }, message: "Item found", statusCode: 200, meta: { total: 1 } });
       */
      success: (
        data?: any,
        message?: string,
        statusCode?: number,
        meta?: any
      ) => void;
      /**
       * Send a created response with optional data, message, and pagination meta.
       * @param data 
       * @param message 
       * @param meta 
       * @example <caption>Using data directly</caption>
       * res.created({ id: 1, name: "Item" }, "Item created", { total: 1 });
       * @example <caption>Using an options object (Note use keys according to your config)</caption>
       * res.created({ data: { id: 1, name: "Item" }, message: "Item created", meta: { total: 1 } });
       */
      created: (
        data?: any,
        message?: string,
        statusCode?: number,
        meta?: any
      ) => void;
      /**
       * Send an updated response with optional data, message, and pagination meta.
       * @param data 
       * @param message 
       * @param meta 
       * @example <caption>Using data directly</caption>
       * res.updated({ id: 1, name: "Item" }, "Item updated", { total: 1 });
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.updated({ data: { id: 1, name: "Item" }, message: "Item updated", meta: { total: 1 } });
       */
      updated: (
        data?: any,
        message?: string,
        statusCode?: number,
        meta?: any
      ) => void;
      /**
       * Send a deleted response with an optional message and status code.
       * @param message
       * @param statusCode
       * @example <caption>Using a custom message</caption>
       * res.deleted("Item deleted", 200);
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.deleted({ message: "Item deleted", statusCode: 200 });
       */
      deleted: (message?: string, statusCode?: number) => void;
      /**
       * Send an error response with a message, status code, and optional errors.
       * @param message 
       * @param statusCode 
       * @param errors 
       * @example <caption>Using a custom message</caption>
       * res.error("Something went wrong", 500, [{ field: "name", message: "Name is required" }]);
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.error({ message: "Something went wrong", statusCode: 500, errors: [...] });
       */
      error: (message?: string, statusCode?: number, errors?: any[]) => void;
      /**
       * Send a 400 Bad Request response with optional errors and message.
       * @param errors 
       * @param message 
       * @param statusCode 
       * @example <caption>Using a list of errors</caption>
       * res.badRequest([{ field: "email", message: "Email is required" }], "Bad Request");
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.badRequest({ errors: [{ field: "email", message: "Email is required" }], message: "Bad Request" });
       */
      badRequest: (
        errors?: any[],
        message?: string,
        statusCode?: number
      ) => void;
      /**
       * Send a 422 Validation Failed response with optional errors and message.
       * @param errors
       * @param message
       * @param statusCode
       * @example <caption>Using a list of errors</caption>
       * res.failValidation([{ field: "email", message: "Email is required" }], "Validation failed");
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.failValidation({ errors: [{ field: "email", message: "Email does not exist" }], message: "Validation failed" });
       */
      failValidation: (
        errors?: any[],
        message?: string,
        statusCode?: number
      ) => void;
      /**
       * Send a 404 Not Found response with an optional message.
       * @param message
       * @param statusCode
       * @example <caption>Using a custom message</caption>
       * res.notFound("Item not found", 404);
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.notFound({ message: "Item not found", statusCode: 404 });
       */
      notFound: (message?: string, statusCode?: number) => void;
      /**
       * Send a 401 Unauthorized response with an optional message and errors.
       * @param message
       * @param statusCode
       * @param errors
       * @example <caption>Using a custom message</caption>
       * res.unauthorized("Unauthorized access", 401, [{ field: "token", message: "Token is invalid" }]);
       * @example <caption>Using an options object(Note use keys according to your config)</caption>
       * res.unauthorized({ message: "Unauthorized access", statusCode: 401, errors: [...] });
       */
      unauthorized: (
        message?: string,
        statusCode?: number,
        errors?: any[]
      ) => void;
    }
  }
}

export let config: IResponseConfig = {
  safeInput: true,
  successKey: "success",
  messageKey: "message",
  dataKey: "data",
  errorKey: "errors",
  codeKey: "statusCode",
  defaultStatusCodes: {
    success: 200,
    created: 201,
    updated: 200,
    deleted: 204,
    error: 500,
    badRequest: 400,
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

/**
 * Updates the global response configuration with user-defined settings.
 * 
 * This function merges the existing configuration with any new settings
 * provided by the user. It allows customization of default status codes
 * and other response-related configurations.
 *
 * @param {Partial<IResponseConfig>} userConfig - An object containing
 * user-defined configuration options. This parameter is optional, and
 * any properties not specified will retain their existing values.
 * Valid keys include:
 * - `safeInput`: Whether to enforce safe input patterns. Default is `true`.
 * - `defaultStatusCodes`: An object containing default status codes for
 * different response types. Default is `{ success: 200, created: 201,
 * updated: 200, deleted: 204, error: 500 }`.
 * - `enableLogs`: Whether to enable logging. Default is `false`.
 * - `showStack`: Whether to include the stack trace in the response.
 * Default is `true`.
 * - `logger`: The logger to use for logging. Default is `console`.
 * - `pagination`: Configuration for pagination, including keys for
 * @example
 * // Configure the response handler with custom settings
 {
  safeInput: true, // I suggest keeping this true for safety, 
  // dont change it unless you really need parameter style input.
  successKey: "success",
  messageKey: "message",
  dataKey: "data",
  errorKey: "errors",
  codeKey: "statusCode",
  defaultStatusCodes: {
    success: 200,
    created: 201,
    updated: 200,
    deleted: 204,
    error: 500,
    badRequest: 400,
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
 */

export const configureResponse = (
  userConfig: Partial<IResponseConfig> = {}
) => {
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
 * Returns a string containing the current stack trace, with all lines
 * removed that include the strings "node_modules" or "responseHandler". This
 * is used to generate a clean stack trace for error responses.
 *
 * @returns {string} A clean stack trace string.
 */
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
 * Enforces a specific input pattern for response methods, depending on the
 * value of the `safeInput` configuration option.
 *
 * If `safeInput` is `true`, this function will throw an error if the input
 * does not conform to the following pattern:
 *
 * - The first argument must be an object with the following keys:
 *   - `message`: A string error message.
 *   - `code`: An HTTP status code.
 *   - `meta`: An optional object containing pagination data
 *   - `data`: An optional value to be returned as the response data.
 *   - `errors`: An optional array of error strings.
 *
 * If `safeInput` is `false`, this function will throw an error if the input
 * is an object with any of the above keys.
 *
 * @param {IArguments} args - The arguments passed to the response method.
 * @param {string} method - The name of the response method.
 * @param {string[]} allowedKeys - An array of allowed keys for the input object.
 */
const enforceInputPattern = (
  args: IArguments,
  method: string,
  allowedKeys: string[]
) => {
  if (config.safeInput) {
    if (args.length !== 1 || typeof args[0] !== "object" || args[0] === null) {
      throw new Error(
        `❌ ${method}: safeInput enabled - Expected a single object.`
      );
    }
    const keys = Object.keys(args[0]);
    const invalid = keys.filter((k) => !allowedKeys.includes(k));
    if (invalid.length) {
      throw new Error(
        `❌ ${method}: Invalid keys in object - ${invalid.join(", ")}`
      );
    }
  } else {
    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      throw new Error(
        `❌ ${method}: safeInput disabled - Do not pass object-style input.`
      );
    }
  }
};

export const responseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const defineMethod = (
    methodName: string,
    allowedKeys: string[],
    defaultMessage: string,
    defaultCode: number,
    success: boolean
  ) => {
    return function (...args: any[]) {
      enforceInputPattern(arguments, `res.${methodName}`, allowedKeys);
      let data = null,
        message = defaultMessage,
        code = defaultCode,
        meta = undefined,
        errors = [];

      if (config.safeInput) {
        const input = args[0];
        data = input[config.dataKey];
        message = input[config.messageKey] ?? message;
        code = input[config.codeKey] ?? code;
        meta = input.meta;
        errors = input[config.errorKey] || [];
      } else {
        [data, message, code, meta] = args;
        if (
          methodName === "error" ||
          methodName === "badRequest" ||
          methodName === "failValidation" ||
          methodName === "unauthorized"
        ) {
          [message, code, errors] = args;
        } else if (methodName === "notFound" || methodName === "deleted") {
          [message, code] = args;
        }
      }

      const response: Record<string, any> = {
        [config.successKey]: success,
        [config.messageKey]: message,
        [config.codeKey]: code,
      };

      if (success) response[config.dataKey] = data ?? null;
      if (!success) response[config.errorKey] = errors ?? [];
      if (meta && success) response.meta = meta;
      if (!success && config.showStack) response.stack = getCleanStack();
      if (config.enableLogs)
        config.logger.log(`${success ? "✅" : "❌"} ${methodName}:`, response);

      res.status(code).json(response);
    };
  };
  
  res.success = defineMethod(
    "success",
    [config.dataKey, config.messageKey, config.codeKey, "meta"],
    "Success",
    config.defaultStatusCodes.success,
    true
  );
  res.created = defineMethod(
    "created",
    [config.dataKey, config.messageKey, config.codeKey, "meta"],
    "Created",
    config.defaultStatusCodes.created,
    true
  );
  res.updated = defineMethod(
    "updated",
    [config.dataKey, config.messageKey, config.codeKey, "meta"],
    "Updated",
    config.defaultStatusCodes.updated,
    true
  );
  res.deleted = defineMethod(
    "deleted",
    [config.messageKey, config.codeKey],
    "Deleted",
    config.defaultStatusCodes.deleted,
    true
  );
  res.error = defineMethod(
    "error",
    [config.messageKey, config.codeKey, config.errorKey],
    "Error",
    config.defaultStatusCodes.error,
    false
  );
  res.badRequest = defineMethod(
    "badRequest",
    [config.errorKey, config.messageKey, config.codeKey],
    "Bad Request",
    config.defaultStatusCodes.badRequest,
    false
  );
  res.failValidation = defineMethod(
    "failValidation",
    [config.errorKey, config.messageKey, config.codeKey],
    "Validation failed",
    config.defaultStatusCodes.validation,
    false
  );
  res.notFound = defineMethod(
    "notFound",
    [config.messageKey, config.codeKey],
    "Not Found",
    config.defaultStatusCodes.notFound,
    false
  );
  res.unauthorized = defineMethod(
    "unauthorized",
    [config.messageKey, config.codeKey, config.errorKey],
    "Unauthorized",
    config.defaultStatusCodes.unauthorized,
    false
  );

  next();
};

export const fallbackErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code = config.defaultStatusCodes.error;
  const response: Record<string, any> = {
    [config.successKey]: false,
    [config.messageKey]: err.message || "Unhandled Error",
    [config.errorKey]: err.stack ? [err.stack] : [],
    [config.codeKey]: code,
  };
  if (config.showStack) response.stack = getCleanStack();
  if (config.enableLogs) config.logger.error("🔥 Fallback Error:", err);
  res.status(code).json(response);
};
