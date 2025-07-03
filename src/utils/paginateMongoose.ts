// src/utils/paginateMongoose.ts

import { FilterQuery, Model, Aggregate } from "mongoose"; // Import Aggregate
import { MongoosePaginatedResult, OffsetMeta, CursorMeta } from "../interface/paginateMongoose";
import { config } from "../responseHandler";

/**
 * Paginates a Mongoose query result set, supporting both cursor-based and offset-based pagination.
 * This function can handle both standard `find` queries and Mongoose `aggregate` pipelines.
 *
 * @template T - The type of the Mongoose document.
 * @param {Model<T>} model - The Mongoose model to query.
 * @param {FilterQuery<T>} [query={}] - The filter query to apply to the model (for `find` queries) or the initial `$match` stage (for `aggregate` queries).
 * @param {Object} [options={}] - Pagination and query options.
 * @param {number} [options.page] - The page number for offset-based pagination.
 * @param {number} [options.limit] - Maximum number of documents per page.
 * @param {any} [options.nextCursor] - The cursor value for cursor-based pagination.
 * @param {string} [options.cursorField] - The field to use as the cursor.
 * @param {Record<string, 1 | -1>} [options.sort] - Sorting criteria for the query.
 * @param {string} [options.select] - Fields to include or exclude in the result documents (only for `find` queries).
 * @param {string} [options.populate] - Population paths for the query (only for `find` queries).
 * @param {boolean} [options.isAggregate] - Set to `true` if the query is an aggregation pipeline.
 * @param {any[]} [options.pipeline] - The aggregation pipeline stages (required if `isAggregate` is `true`).
 * @returns {Promise<MongoosePaginatedResult<T>>} A promise that resolves to the paginated result.
 * @throws {Error} If an error occurs during pagination.
 * @example
 * // Offset-based find query
 * const { data, meta } = await paginateMongoose(UserModel, { age: { $gte: 18 } }, {
 * page: 1,
 * limit: 10,
 * });
 *
 * // Cursor-based aggregation query
 * const { data: aggData, meta: aggMeta } = await paginateMongoose(OrderModel, {}, {
 * isAggregate: true,
 * pipeline: [
 * { $match: { status: 'completed' } },
 * { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'productInfo' } },
 * { $unwind: '$productInfo' },
 * { $project: { orderId: 1, totalAmount: 1, 'productInfo.name': 1 } }
 * ],
 * limit: 5,
 * nextCursor: 'someOrderId123',
 * cursorField: 'orderId',
 * sort: { orderId: 1 }
 * });
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
    isAggregate?: boolean; // New option
    pipeline?: any[]; // New option
  } = {}
): Promise<MongoosePaginatedResult<T>> => {
  const limit = parseInt(String(options.limit)) || 10;
  const sort = options.sort || { _id: 1 };
  const cursorField = options.cursorField || "_id";

  // Get pagination keys from the global config
  const keys = config.pagination!.keys!;

  if (options.isAggregate) {
    // Aggregation-based pagination
    let basePipeline: any[] = options.pipeline || [];

    // If a query object is provided, prepend it as a $match stage for aggregation
    if (Object.keys(query).length > 0) {
      basePipeline = [{ $match: query }, ...basePipeline];
    }

    if (options.nextCursor) {
      // Cursor-based aggregation
      const cursorMatchStage = {
        $match: {
          [cursorField]: { $gt: options.nextCursor },
        },
      };

      const aggPipeline = [
        ...basePipeline,
        cursorMatchStage,
        { $sort: sort }, // Apply sort for cursor
        { $limit: limit + 1 }, // Fetch one extra to check for next page
      ];

      const docs = await model.aggregate(aggPipeline);

      const hasNextPage = docs.length > limit;
      const data = hasNextPage ? docs.slice(0, -1) : docs;
      const nextCursor = hasNextPage
        ? data[data.length - 1][cursorField]?.toString?.() || null
        : null;

      const meta: CursorMeta = {
        mode: "cursor",
        [keys.limit as string]: limit,
        cursorField: cursorField,
        [keys.nextCursor as string]: nextCursor,
        [keys.hasNextPage as string]: hasNextPage,
      } as CursorMeta;

      return {
        data,
        meta,
      };
    } else {
      // Offset-based aggregation
      const page = parseInt(String(options.page)) || 1;
      const skip = (page - 1) * limit;

      // Pipeline for total count
      const countPipeline = [
        ...basePipeline,
        { $count: "total" }
      ];

      // Pipeline for data
      const dataPipeline = [
        ...basePipeline,
        { $sort: sort }, // Apply sort for consistent paging
        { $skip: skip },
        { $limit: limit },
      ];

      const [totalResult, data] = await Promise.all([
        model.aggregate(countPipeline),
        model.aggregate(dataPipeline),
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;
      const totalPages = Math.ceil(total / limit);

      const meta: OffsetMeta = {
        mode: "offset",
        [keys.total as string]: total,
        [keys.page as string]: page,
        [keys.limit as string]: limit,
        [keys.totalPages as string]: totalPages,
        [keys.hasNextPage as string]: page < totalPages,
        [keys.hasPrevPage as string]: page > 1,
      } as OffsetMeta;

      return {
        data,
        meta,
      };
    }
  } else {
    // Original find-based pagination
    const select = options.select || "";
    const populate = options.populate || "";

    if (options.nextCursor) {
      // Cursor-based find
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

      const meta: CursorMeta = {
        mode: "cursor",
        [keys.limit as string]: limit,
        cursorField: cursorField,
        [keys.nextCursor as string]: nextCursor,
        [keys.hasNextPage as string]: hasNextPage,
      } as CursorMeta;

      return {
        data,
        meta,
      };
    } else {
      // Offset-based find
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

      const meta: OffsetMeta = {
        mode: "offset",
        [keys.total as string]: total,
        [keys.page as string]: page,
        [keys.limit as string]: limit,
        [keys.totalPages as string]: totalPages,
        [keys.hasNextPage as string]: page < totalPages,
        [keys.hasPrevPage as string]: page > 1,
      } as unknown as OffsetMeta;

      return {
        data,
        meta,
      };
    }
  }
};

export { paginateMongoose } ;