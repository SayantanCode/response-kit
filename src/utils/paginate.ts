// File: src/utils/paginate.ts

import { PaginatedResult, CursorPaginatedResult } from '../types/pagination';

/**
 * Pagination utility for arrays
 */
export const paginateArray = <T>(
  array: T[],
  page: number = 1,
  limit: number = 10
): PaginatedResult<T> => {
  const total = array.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = array.slice(start, start + limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Pagination utility for Mongoose or any DB query (page-based)
 */
export const paginateQuery = async <T>(
  model: any,
  query: Record<string, any> = {},
  options: {
    page?: number;
    limit?: number;
    sort?: Record<string, any>;
    select?: string;
    populate?: string;
  } = {}
): Promise<PaginatedResult<T>> => {
  const page = parseInt(String(options.page)) || 1;
  const limit = parseInt(String(options.limit)) || 10;
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    model.countDocuments(query),
    model
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(options.sort || {})
      .select(options.select || "")
      .populate(options.populate || ""),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Cursor-based pagination (for performance with large data sets)
 */
export const paginateCursor = async <T>(
  model: any,
  query: Record<string, any> = {},
  options: {
    limit?: number;
    sort?: Record<string, number>;
    cursorField?: string;
    cursorValue?: any;
    direction?: string;
  } = {}
): Promise<CursorPaginatedResult<T>> => {
  const limit = parseInt(String(options.limit)) || 10;
  const sort = options.sort || { _id: 1 };
  const cursorField = options.cursorField || "_id";
  const cursorValue = options.cursorValue;
  const direction = options.direction === "backward" ? -1 : 1;

  const finalSort: Record<string, number> = {};
  for (const key in sort) {
    finalSort[key] = direction * (sort[key] === -1 ? -1 : 1);
  }

  if (cursorValue) {
    query[cursorField] =
      direction === 1 ? { $gt: cursorValue } : { $lt: cursorValue };
  }

  const data = await model.find(query).sort(finalSort).limit(limit);

  const nextCursor = data.length ? data[data.length - 1][cursorField] : null;
  const hasNextPage = data.length === limit;

  return {
    data,
    meta: {
      limit,
      cursorField,
      nextCursor,
      hasNextPage,
      direction,
    },
  };
};
