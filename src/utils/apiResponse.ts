// src/utils/apiResponse.ts
import { Response } from 'express'
import logger from './logger'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Send a successful API response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  if (message) {
    response.message = message
  }
  return res.status(statusCode).json(response)
}

/**
 * Send a paginated API response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  message?: string
): Response => {
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages,
    },
  }
  if (message) {
    response.message = message
  }
  return res.status(200).json(response)
}

/**
 * Send an error API response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): Response => {
  // Log error
  logger.error(message, {
    statusCode,
    error,
    path: res.req?.path,
    method: res.req?.method,
  })

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    message,
  }
  // Only include error details in development
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error
  }
  return res.status(statusCode).json(response)
}



