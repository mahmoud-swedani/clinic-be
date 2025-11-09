// src/services/audit.service.ts
import { AuditLog } from '../models/auditLog.model'
import mongoose from 'mongoose'
import { Request } from 'express'

export interface AuditLogData {
  entityType: 'User' | 'Role' | 'Permission' | 'RolePermission'
  entityId: mongoose.Types.ObjectId
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'assign-permission'
    | 'remove-permission'
    | 'update-permissions'
    | 'assign-role'
    | 'remove-role'
    | 'toggle-status'
  changes?: {
    before?: any
    after?: any
  }
  performedBy: mongoose.Types.ObjectId
  req?: Request
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async logAudit(auditData: AuditLogData) {
    const logData: any = {
      entityType: auditData.entityType,
      entityId: auditData.entityId,
      action: auditData.action,
      performedBy: auditData.performedBy,
      performedAt: new Date(),
    }

    if (auditData.changes) {
      logData.changes = auditData.changes
    }

    // Extract IP and user agent from request if available
    if (auditData.req) {
      logData.ipAddress =
        auditData.req.ip ||
        auditData.req.headers['x-forwarded-for'] ||
        auditData.req.socket.remoteAddress
      logData.userAgent = auditData.req.headers['user-agent']
    }

    const auditLog = new AuditLog(logData)
    await auditLog.save()
    return auditLog
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(
    filters: {
      entityType?: string
      entityId?: string
      action?: string
      performedBy?: string
      startDate?: Date
      endDate?: Date
    },
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit
    const query: any = {}

    if (filters.entityType) {
      query.entityType = filters.entityType
    }

    if (filters.entityId) {
      query.entityId = filters.entityId
    }

    if (filters.action) {
      query.action = filters.action
    }

    if (filters.performedBy) {
      query.performedBy = filters.performedBy
    }

    if (filters.startDate || filters.endDate) {
      query.performedAt = {}
      if (filters.startDate) {
        query.performedAt.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.performedAt.$lte = filters.endDate
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email')
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ])

    return { logs, total }
  }

  /**
   * Get audit history for a specific entity
   */
  static async getEntityAuditHistory(
    entityType: string,
    entityId: string,
    limit: number = 50
  ) {
    const logs = await AuditLog.find({
      entityType,
      entityId,
    })
      .populate('performedBy', 'name email')
      .sort({ performedAt: -1 })
      .limit(limit)
      .lean()

    return logs
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditHistory(userId: string, limit: number = 50) {
    return this.getEntityAuditHistory('User', userId, limit)
  }

  /**
   * Create audit log for entity creation
   */
  static async logCreate(
    entityType: AuditLogData['entityType'],
    entityId: mongoose.Types.ObjectId,
    performedBy: mongoose.Types.ObjectId,
    req?: Request
  ) {
    return this.logAudit({
      entityType,
      entityId,
      action: 'create',
      performedBy,
      req,
    })
  }

  /**
   * Create audit log for entity update
   */
  static async logUpdate(
    entityType: AuditLogData['entityType'],
    entityId: mongoose.Types.ObjectId,
    performedBy: mongoose.Types.ObjectId,
    changes: { before: any; after: any },
    req?: Request
  ) {
    return this.logAudit({
      entityType,
      entityId,
      action: 'update',
      changes,
      performedBy,
      req,
    })
  }

  /**
   * Create audit log for entity deletion
   */
  static async logDelete(
    entityType: AuditLogData['entityType'],
    entityId: mongoose.Types.ObjectId,
    performedBy: mongoose.Types.ObjectId,
    beforeData: any,
    req?: Request
  ) {
    return this.logAudit({
      entityType,
      entityId,
      action: 'delete',
      changes: { before: beforeData },
      performedBy,
      req,
    })
  }
}

