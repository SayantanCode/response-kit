// src/utils/paginateMongoose.ts

import { FilterQuery, Model } from "mongoose";
import { MongoosePaginatedResult } from "../interface/paginateMongoose";

/**
 * Paginates a Mongoose query result set, supporting both cursor-based and offset-based pagination.
 *
 * @template T - The type of the Mongoose document.
 * @param {Model<T>} model - The Mongoose model to query.
 * @param {FilterQuery<T>} [query={}] - The filter query to apply to the model.
 * @param {Object} [options={}] - Pagination and query options.
 * @param {number} [options.page] - The page number for offset-based pagination.
 * @param {number} [options.limit] - Maximum number of documents per page.
 * @param {any} [options.nextCursor] - The cursor value for cursor-based pagination.
 * @param {string} [options.cursorField] - The field to use as the cursor.
 * @param {Record<string, 1 | -1>} [options.sort] - Sorting criteria for the query.
 * @param {string} [options.select] - Fields to include or exclude in the result documents.
 * @param {string} [options.populate] - Population paths for the query.
 * @returns {Promise<MongoosePaginatedResult<T>>} A promise that resolves to the paginated result.
 * @throws {Error} If an error occurs during pagination.
 * @example
 * const { data, meta } = await paginateMongoose(UserModel, { age: { $gte: 18 } }, {
 *   page: 1,
 *   limit: 10,
 * });
 *
 * // data: Array of user documents
 * // meta: Pagination metadata including total count, current page, etc.
 */

const paginateMongoose = async <T extends Document>(
  model: Model<T>,
  query: FilterQuery<T> = {},
  options: {
    page?: number;
    limit?: number;
    nextCursor?: any;
    cursorField?: string;
    sort?: Record<string, 1 | -1>;
    select?: string;
    populate?: string;
  } = {}
): Promise<MongoosePaginatedResult<T>> => {
  const limit = parseInt(String(options.limit)) || 10;
  const sort = options.sort || { _id: 1 };
  const select = options.select || "";
  const populate = options.populate || "";
  const cursorField = options.cursorField || "_id";

  if (options.nextCursor) {
    // Cursor-based pagination
    const cursorQuery: FilterQuery<T> = {
      ...query,
      [cursorField]: { $gt: options.nextCursor },
    };

    const docs = await model
      .find(cursorQuery)
      .sort(sort)
      .limit(limit + 1)
      .select(select)
      .populate(populate);

    const hasNextPage = docs.length > limit;
    const data = hasNextPage ? docs.slice(0, -1) : docs;
    const nextCursor = hasNextPage
      ? data[data.length - 1].get(cursorField)?.toString?.() || null
      : null;

    return {
      data,
      meta: {
        mode: "cursor",
        limit,
        cursorField,
        nextCursor,
        hasNextPage,
      },
    };
  }

  // Offset-based pagination
  const page = parseInt(String(options.page)) || 1;
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    model.countDocuments(query),
    model
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(select)
      .populate(populate),
  ]);

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

export default paginateMongoose;
