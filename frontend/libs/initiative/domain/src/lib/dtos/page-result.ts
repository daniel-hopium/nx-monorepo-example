/** Seitenweise Antwort des Backends (Pagination). */
export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const emptyPage = <T>(): PageResult<T> => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
});
