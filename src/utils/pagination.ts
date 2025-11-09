// src/utils/pagination.ts
/**
 * Parse pagination parameters from request query
 */
export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export const parsePagination = (req: {
  query: { page?: string; limit?: string }
}): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10))) // Max 100 items per page
  const skip = (page - 1) * limit

  return { page, limit, skip }
}







