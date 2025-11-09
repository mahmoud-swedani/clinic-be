"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seedAdmin.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = require("../src/models/user.model");
const branch_model_1 = require("../src/models/branch.model");
dotenv_1.default.config();
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        // Check if admin already exists
        const existingAdmin = yield user_model_1.User.findOne({ email: 'admin@clinic.com' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Role:', existingAdmin.role);
            return;
        }
        // Create a default branch if it doesn't exist
        let branch = yield branch_model_1.Branch.findOne({ name: 'الفرع الرئيسي' });
        if (!branch) {
            branch = yield branch_model_1.Branch.create({
                name: 'الفرع الرئيسي',
                location: 'القاهرة، مصر',
                phone: '01234567890',
                isActive: true
            });
            console.log('✅ Created default branch');
        }
        // Create admin user
        const adminUser = yield user_model_1.User.create({
            name: 'مدير النظام',
            email: 'admin@clinic.com',
            password: 'admin123', // Will be hashed automatically by pre-save hook
            role: 'مالك', // Owner role - highest privilege
            branch: branch._id,
            isActive: true
        });
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', adminUser.email);
        console.log('🔑 Password: admin123');
        console.log('👤 Role:', adminUser.role);
        console.log('🏢 Branch:', branch.name);
        console.log('🆔 User ID:', adminUser._id);
    }
    catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
    finally {
        yield mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
});
// Run the seeding
seedAdmin();
