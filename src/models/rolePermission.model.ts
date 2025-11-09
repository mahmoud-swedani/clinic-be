// src/models/rolePermission.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IRolePermission extends Document {
  role: mongoose.Types.ObjectId
  permission: mongoose.Types.ObjectId
  grantedBy: mongoose.Types.ObjectId
  grantedAt: Date
}

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
      required: true,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
)

// Compound unique index to prevent duplicate role-permission assignments
rolePermissionSchema.index({ role: 1, permission: 1 }, { unique: true })

// Database indexes for performance optimization
rolePermissionSchema.index({ role: 1 })
rolePermissionSchema.index({ permission: 1 })
rolePermissionSchema.index({ grantedAt: -1 })

export const RolePermission = mongoose.model<IRolePermission>(
  'RolePermission',
  rolePermissionSchema
)

