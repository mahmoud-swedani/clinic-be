# Clinic Backend API - Postman Collection Setup Guide

## 📋 Overview
This guide will help you import and use the Postman collection for the Clinic Backend API.

## 📁 Files Created
1. `Clinic-Backend-API.postman_collection.json` - Complete API collection
2. `Clinic-Backend-Environment.postman_environment.json` - Environment variables

## 🚀 Import Instructions

### Step 1: Import Collection
1. Open Postman
2. Click "Import" button
3. Select `Clinic-Backend-API.postman_collection.json`
4. Click "Import"

### Step 2: Import Environment
1. In Postman, click the gear icon (⚙️) in the top right
2. Click "Import"
3. Select `Clinic-Backend-Environment.postman_environment.json`
4. Click "Import"
5. Select the imported environment from the dropdown

## 🔧 Environment Variables Setup

### Required Variables
- `baseUrl`: Set to your server URL (default: `http://localhost:5000`)
- `authToken`: Automatically set after login

### Optional Test Variables
You can manually set these for testing specific resources:
- `userId`, `patientId`, `doctorId`, `appointmentId`
- `branchId`, `departmentId`, `serviceId`
- `treatmentStageId`, `invoiceId`, `financialRecordId`
- `productId`, `saleId`, `managerId`

## 🔐 Authentication Flow

### 1. Login First
1. Go to "Authentication" folder
2. Run "Login" request with valid credentials:
   ```json
   {
     "email": "admin@clinic.com",
     "password": "password123"
   }
   ```
3. The `authToken` will be automatically set

### 2. Use Authenticated Requests
- All other requests will automatically use the token
- Token is set at collection level using Bearer authentication

## 📚 API Endpoints Overview

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users Management
- `POST /api/users` - Create user (Manager/Owner only)
- `GET /api/users` - Get all users (Manager/Owner only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/toggle-status` - Toggle user status

### User Roles
- `GET /api/user-roles/doctors` - Get doctors
- `GET /api/user-roles/managers` - Get managers
- `GET /api/user-roles/accountants` - Get accountants
- `GET /api/user-roles/secretaries` - Get secretaries

### Patients
- `POST /api/patients` - Create patient
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id/with-appointments` - Get patient with appointments

### Appointments
- `POST /api/appointments` - Create appointment (Manager/Owner only)
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/patient/:patientId` - Get appointments by patient
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Branches
- `POST /api/branches` - Create branch (Owner/Manager only)
- `GET /api/branches` - Get all branches
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Services
- `POST /api/services` - Create service (Owner/Manager only)
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/by-department/:departmentId` - Get services by department
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Treatment Stages
- `POST /api/treatment-stages` - Create treatment stage (Owner/Doctor only)
- `GET /api/treatment-stages/patient/:patientId` - Get stages by patient
- `GET /api/treatment-stages` - Get all stages (Manager/Owner only)
- `PUT /api/treatment-stages/:id` - Update stage (Manager only)
- `DELETE /api/treatment-stages/:id` - Delete stage (Manager only)

### Invoices
- `GET /api/invoices/unpaid` - Get unpaid invoices
- `GET /api/invoices` - Get all invoices

### Payments
- `POST /api/payments` - Create payment (Accountant only)

### Financial Records
- `POST /api/financial-records` - Create financial record
- `GET /api/financial-records` - Get all records (with optional filtering)
- `GET /api/financial-records/:id` - Get record by ID
- `POST /api/financial-records/:id/add-payment` - Add payment to record
- `DELETE /api/financial-records/:id` - Delete record

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - Get all sales (with optional patient filtering)
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales/:id/payments` - Add payment to sale
- `GET /api/sales/:id/payments` - Get sale payments

### Dashboard
- `GET /api/dashboard` - Get dashboard data

## 🔒 Role-Based Access Control

### Roles Available
- `مالك` (Owner) - Full access
- `مدير` (Manager) - Most operations
- `طبيب` (Doctor) - Medical operations
- `محاسب` (Accountant) - Financial operations
- `سكرتير` (Secretary) - Administrative operations

### Access Levels
- **Owner**: All operations
- **Manager**: User management, appointments, branches, services
- **Doctor**: Patients, appointments, treatment stages
- **Accountant**: Payments, financial records
- **Secretary**: Patients, basic operations

## 🧪 Testing Tips

### 1. Start with Authentication
Always login first to get the authentication token.

### 2. Test Data Flow
1. Create a branch
2. Create a department (linked to branch)
3. Create a service (linked to department)
4. Create a user (doctor)
5. Create a patient
6. Create an appointment
7. Create treatment stages

### 3. Use Environment Variables
Set IDs in environment variables for easier testing:
- After creating a patient, copy the ID to `patientId` variable
- After creating a doctor, copy the ID to `doctorId` variable
- And so on...

### 4. Error Handling
- Check response status codes
- Read error messages in Arabic
- Ensure proper authentication and authorization

## 📝 Sample Test Data

### Login Credentials
```json
{
  "email": "admin@clinic.com",
  "password": "password123"
}
```

### Sample Patient
```json
{
  "fullName": "محمد أحمد",
  "phone": "01234567890",
  "gender": "male",
  "dateOfBirth": "1990-01-01",
  "address": "القاهرة، مصر",
  "medicalHistory": "لا توجد أمراض مزمنة"
}
```

### Sample Product
```json
{
  "name": "معجون أسنان",
  "category": "منتجات العناية",
  "unit": "قطعة",
  "purchasePrice": 50,
  "sellingPrice": 75,
  "stock": 100,
  "notes": "معجون أسنان عالي الجودة"
}
```

## 🚨 Important Notes

1. **Authentication Required**: Most endpoints require authentication
2. **Role-Based Access**: Different roles have different permissions
3. **Arabic Support**: API supports Arabic text in requests/responses
4. **Environment Variables**: Use them to avoid hardcoding IDs
5. **Error Messages**: Error messages are in Arabic
6. **Date Format**: Use ISO 8601 format for dates (`YYYY-MM-DDTHH:mm:ss.sssZ`)

## 🔧 Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check if you're logged in and token is set
2. **403 Forbidden**: Check if your role has permission for the operation
3. **404 Not Found**: Check if the resource ID exists
4. **400 Bad Request**: Check request body format and required fields

### Debug Steps
1. Check environment variables are set correctly
2. Verify authentication token is valid
3. Check request body format
4. Verify user role permissions
5. Check server logs for detailed error information
