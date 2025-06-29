//File: src/types/pagination.ts

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IPaginatedResult<T> {
  data: T[];
  meta: IPaginationMeta;
}

export interface ICursorPaginationMeta {
  limit: number;
  cursorField: string;
  nextCursor: any;
  hasNextPage: boolean;
  direction: number;
}

export interface ICursorPaginatedResult<T> {
  data: T[];
  meta: ICursorPaginationMeta;
}