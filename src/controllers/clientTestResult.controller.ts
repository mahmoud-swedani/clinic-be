// src/controllers/clientTestResult.controller.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { ClientTestResult } from '../models/clientTestResult.model'
import { Client } from '../models/client.model'

// Create test result record
export const createClientTestResult = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params

    // Verify client exists
    const client = await Client.findById(clientId)
    if (!client) {
      return sendError(res, 'العميل غير موجود', 404)
    }

    const testResult = await ClientTestResult.create({
      ...req.body,
      client: clientId,
    })

    return sendSuccess(res, testResult, 'تم إضافة نتيجة الفحص بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إضافة نتيجة الفحص',
      400,
      error?.message || String(error)
    )
  }
}

// Get all test results for a client
export const getClientTestResults = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params
    const { page, limit } = parsePagination(req)

    const skip = (page - 1) * limit

    const [testResults, total] = await Promise.all([
      ClientTestResult.find({ client: clientId })
        .populate('doctor', 'name')
        .sort({ testDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientTestResult.countDocuments({ client: clientId }),
    ])

    return sendPaginated(res, testResults, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب نتائج الفحوصات',
      500,
      error?.message || String(error)
    )
  }
}

// Get test result by ID
export const getTestResultById = async (req: Request, res: Response) => {
  try {
    const testResult = await ClientTestResult.findById(req.params.id)
      .populate('doctor', 'name')
      .lean()
    if (!testResult) {
      return sendError(res, 'نتيجة الفحص غير موجودة', 404)
    }
    return sendSuccess(res, testResult)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب نتيجة الفحص',
      500,
      error?.message || String(error)
    )
  }
}

// Update test result
export const updateTestResult = async (req: Request, res: Response) => {
  try {
    const testResult = await ClientTestResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('doctor', 'name')
      .lean()

    if (!testResult) {
      return sendError(res, 'نتيجة الفحص غير موجودة', 404)
    }

    return sendSuccess(res, testResult, 'تم تحديث نتيجة الفحص بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث نتيجة الفحص',
      500,
      error?.message || String(error)
    )
  }
}

// Delete test result
export const deleteTestResult = async (req: Request, res: Response) => {
  try {
    const deleted = await ClientTestResult.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return sendError(res, 'نتيجة الفحص غير موجودة', 404)
    }
    return sendSuccess(res, null, 'تم حذف نتيجة الفحص بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف نتيجة الفحص',
      500,
      error?.message || String(error)
    )
  }
}

