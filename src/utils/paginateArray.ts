// src/utils/paginateArray.ts

import { IArrayPaginatedResult } from "../interface/paginateArray";

/**
 * Paginates an array of values, supporting both cursor-based and offset-based pagination.
 *
 * @param {T[]} array - The array of values to paginate.
 * @param {Object} [options] - Options for pagination.
 * @param {number} [options.page] - The page number for offset-based pagination.
 * @param {number} [options.limit] - The maximum number of values per page.
 * @param {number} [options.nextCursor] - The cursor for cursor-based pagination.
 * @returns {IArrayPaginatedResult<T>} A paginated result object.
 * @example
 * const data = [
 *   { id: 1, name: "Alice" },
 *   { id: 2, name: "Bob" },
 *   { id: 3, name: "Carol" },
 *   { id: 4, name: "Dave" },
 *   { id: 5, name: "Eve" },
 * ] as const;
 *
 * const result = paginateArray(data, { page: 2, limit: 2 });
 * console.log(result);
 * // {
 * //   data: [{ id: 3, name: "Carol" }, { id: 4, name: "Dave" }],
 * //   meta: {
 * //     mode: "offset",
 * //     total: 5,
 * //     page: 2,
 * //     limit: 2,
 * //     totalPages: 3,
 * //     hasNextPage: true,
 * //     hasPrevPage: true,
 * //   },
 * // }
 *
 * @example
 * const result = paginateArray(data, { nextCursor: 3 });
 * console.log(result);
 * // {
 * //   data: [{ id: 4, name: "Dave" }, { id: 5, name: "Eve" }],
 * //   meta: {
 * //     mode: "cursor",
 * //     limit: 2,
 * //     nextCursor: 4,
 * //     hasNextPage: false,
 * //   },
 * // }
 */
const paginateArray = <T>(
  array: T[],
  options: {
    page?: number;
    limit?: number;
    nextCursor?: number;
  } = {}
): IArrayPaginatedResult<T> => {
  const limit = parseInt(String(options.limit)) || 10;

  if (options.nextCursor !== undefined) {
    const cursorIndex = Number(options.nextCursor);
    const start = isNaN(cursorIndex) ? 0 : cursorIndex + 1;
    const data = array.slice(start, start + limit);
    const hasNextPage = start + limit < array.length;
    const nextCursor = hasNextPage ? start + limit - 1 : null;

    return {
      data,
      meta: {
        mode: "cursor",
        limit,
        nextCursor,
        hasNextPage,
      },
    };
  }

  const page = parseInt(String(options.page)) || 1;
  const start = (page - 1) * limit;
  const data = array.slice(start, start + limit);
  const total = array.length;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      mode: "offset",
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export default paginateArray;
