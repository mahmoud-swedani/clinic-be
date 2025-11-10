// src/models/auditLog.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IAuditLog extends Document {
  entityType: string
  entityId: mongoose.Types.ObjectId
  action: string
  changes?: {
    before?: any
    after?: any
  }
  performedBy: mongoose.Types.ObjectId
  performedAt: Date
  ipAddress?: string
  userAgent?: string
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['User', 'Role', 'Permission', 'RolePermission', 'Appointment', 'Patient'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'assign-permission',
        'remove-permission',
        'assign-role',
        'remove-role',
        'toggle-status',
      ],
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: false }
)

// Database indexes for performance optimization
auditLogSchema.index({ entityType: 1, entityId: 1 })
auditLogSchema.index({ performedBy: 1 })
auditLogSchema.index({ performedAt: -1 })
auditLogSchema.index({ action: 1 })
auditLogSchema.index({ entityType: 1, performedAt: -1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema)

