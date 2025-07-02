import { Model, Document, FilterQuery } from "mongoose";

export interface OffsetMeta {
  mode: "offset";
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CursorMeta {
  mode: "cursor";
  limit: number;
  cursorField: string;
  nextCursor: string | null;
  hasNextPage: boolean;
}

export type MongoosePaginationMeta = OffsetMeta | CursorMeta;

export interface MongoosePaginatedResult<T> {
  data: T[];
  meta: MongoosePaginationMeta;
}