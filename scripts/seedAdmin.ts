// scripts/seedAdmin.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from '../src/models/user.model'
import { Branch } from '../src/models/branch.model'

dotenv.config()

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('✅ Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@clinic.com' })
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists')
      console.log('📧 Email:', existingAdmin.email)
      console.log('👤 Role:', existingAdmin.role)
      return
    }

    // Create a default branch if it doesn't exist
    let branch = await Branch.findOne({ name: 'الفرع الرئيسي' })
    if (!branch) {
      branch = await Branch.create({
        name: 'الفرع الرئيسي',
        location: 'القاهرة، مصر',
        phone: '01234567890',
        isActive: true
      })
      console.log('✅ Created default branch')
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'مدير النظام',
      email: 'admin@clinic.com',
      password: 'admin123', // Will be hashed automatically by pre-save hook
      role: 'مالك', // Owner role - highest privilege
      branch: branch._id,
      isActive: true
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', adminUser.email)
    console.log('🔑 Password: admin123')
    console.log('👤 Role:', adminUser.role)
    console.log('🏢 Branch:', branch.name)
    console.log('🆔 User ID:', adminUser._id)

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run the seeding
seedAdmin()
