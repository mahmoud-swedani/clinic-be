# 🔐 How to Create an Admin User

This guide explains different methods to create an admin user in your Clinic Management System.

## 📋 Available User Roles

Your system has the following roles (in order of privilege):
1. **مالك** (Owner) - Highest privilege, can do everything
2. **مدير** (Manager) - Can manage users, appointments, branches, services
3. **طبيب** (Doctor) - Can manage patients, appointments, treatment stages
4. **محاسب** (Accountant) - Can manage payments and financial records
5. **سكرتير** (Secretary) - Can manage patients and basic operations

## 🚀 Method 1: Using the Seeding Script (Recommended)

### Step 1: Run the Seeding Script
```bash
# Using pnpm
pnpm run seed:admin

# Or using npm
npm run seed:admin

# Or using yarn
yarn seed:admin
```

### Step 2: Login with Admin Credentials
After running the script, you can login with:
- **Email**: `admin@clinic.com`
- **Password**: `admin123`
- **Role**: `مالك` (Owner)

## 🛠️ Method 2: Manual Database Creation

### Using MongoDB Compass or CLI
```javascript
// Connect to your MongoDB database
use your_database_name

// First, create a branch (required for user)
db.branches.insertOne({
  name: "الفرع الرئيسي",
  location: "القاهرة، مصر",
  phone: "01234567890",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Get the branch ID
const branch = db.branches.findOne({name: "الفرع الرئيسي"})

// Create admin user
db.users.insertOne({
  name: "مدير النظام",
  email: "admin@clinic.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "admin123" hashed
  role: "مالك",
  branch: branch._id,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🌐 Method 3: Using Postman/API (After First Admin)

Once you have your first admin user, you can create additional users via API:

### Step 1: Login as Admin
```bash
POST /api/auth/login
{
  "email": "admin@clinic.com",
  "password": "admin123"
}
```

### Step 2: Create Additional Users
```bash
POST /api/users
{
  "name": "مدير فرع جديد",
  "email": "manager@clinic.com",
  "password": "manager123",
  "role": "مدير",
  "branch": "BRANCH_ID_HERE"
}
```

## 🔧 Method 4: Direct Node.js Script

Create a temporary script to create admin:

```javascript
// createAdmin.js
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    
    // Create branch first
    const Branch = mongoose.model('Branch', new mongoose.Schema({
      name: String,
      location: String,
      phone: String,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true }))
    
    let branch = await Branch.findOne({ name: 'الفرع الرئيسي' })
    if (!branch) {
      branch = await Branch.create({
        name: 'الفرع الرئيسي',
        location: 'القاهرة، مصر',
        phone: '01234567890'
      })
    }
    
    // Create user
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, enum: ['سكرتير', 'طبيب', 'محاسب', 'مدير', 'مالك'] },
      branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true }))
    
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await User.create({
      name: 'مدير النظام',
      email: 'admin@clinic.com',
      password: hashedPassword,
      role: 'مالك',
      branch: branch._id
    })
    
    console.log('Admin created:', admin.email)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
  }
}

createAdmin()
```

Run with: `node createAdmin.js`

## 🔍 Verification Steps

### 1. Check User Creation
```bash
GET /api/users
# Should return the admin user in the list
```

### 2. Test Login
```bash
POST /api/auth/login
{
  "email": "admin@clinic.com",
  "password": "admin123"
}
```

### 3. Verify Permissions
```bash
GET /api/auth/me
# Should return user with role "مالك"
```

## 🛡️ Security Best Practices

### 1. Change Default Password
After first login, immediately change the password:
```bash
PUT /api/users/USER_ID
{
  "password": "your_secure_password_here"
}
```

### 2. Create Additional Admin Users
Create backup admin accounts:
```bash
POST /api/users
{
  "name": "مدير احتياطي",
  "email": "backup-admin@clinic.com",
  "password": "secure_password",
  "role": "مالك",
  "branch": "BRANCH_ID"
}
```

### 3. Disable Default Account (Optional)
Once you have other admin users, you can disable the default one:
```bash
PATCH /api/users/USER_ID/toggle-status
```

## 🚨 Troubleshooting

### Issue: "Branch is required"
**Solution**: Make sure to create a branch first before creating a user.

### Issue: "Email already exists"
**Solution**: The admin user already exists. Use the existing credentials or delete the existing user first.

### Issue: "Authentication failed"
**Solution**: 
1. Check if the user exists in the database
2. Verify the password is correctly hashed
3. Check if the user is active (`isActive: true`)

### Issue: "Permission denied"
**Solution**: Make sure you're using a user with `مالك` or `مدير` role to create other users.

## 📝 Default Admin Credentials

- **Email**: `admin@clinic.com`
- **Password**: `admin123`
- **Role**: `مالك` (Owner)
- **Branch**: `الفرع الرئيسي`

## 🔄 Next Steps

After creating your admin user:

1. **Login** with the admin credentials
2. **Create branches** for your clinic locations
3. **Create departments** for different medical specialties
4. **Create services** for each department
5. **Create additional users** (doctors, accountants, secretaries)
6. **Set up patients** and start using the system

## 📞 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your MongoDB connection
3. Ensure all required environment variables are set
4. Check that the database is accessible
