// src/models/user.model.ts
import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'سكرتير' | 'طبيب' | 'محاسب' | 'مدير' | 'مالك' // Kept for backward compatibility
  roleId?: mongoose.Types.ObjectId // New reference to Role model
  branch: mongoose.Types.ObjectId
  isActive: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  deletedBy?: mongoose.Types.ObjectId
  deletedAt?: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['سكرتير', 'طبيب', 'محاسب', 'مدير', 'مالك'],
      default: 'سكرتير',
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
// Note: email index is already created by unique: true
userSchema.index({ branch: 1, role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ role: 1 })
userSchema.index({ roleId: 1 })
userSchema.index({ deletedAt: 1 })
userSchema.index({ createdBy: 1 })

// تشفير كلمة السر قبل الحفظ
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// مقارنة كلمة السر
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password)
}

export const User = mongoose.model<IUser>('User', userSchema)
