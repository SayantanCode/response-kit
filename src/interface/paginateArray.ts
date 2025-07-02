//File: src/interface/paginateArray.ts

export interface IOffsetMeta {
  mode: "offset";
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ICursorMeta {
  mode: "cursor";
  limit: number;
  nextCursor: number | null;
  hasNextPage: boolean;
}

export type IArrayPaginationMeta = IOffsetMeta | ICursorMeta;

export interface IArrayPaginatedResult<T> {
  data: T[];
  meta: IArrayPaginationMeta;
}