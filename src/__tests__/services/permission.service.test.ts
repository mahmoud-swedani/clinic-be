// src/__tests__/services/permission.service.test.ts
import { PermissionService } from '../../services/permission.service'
import { Permission } from '../../models/permission.model'
import mongoose from 'mongoose'

jest.mock('../../models/permission.model')
jest.mock('../../models/rolePermission.model')

describe('PermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const permissionData = {
        name: 'patients.create',
        description: 'Create patients',
        category: 'patients',
        createdBy: new mongoose.Types.ObjectId(),
      }

      const mockPermission = {
        _id: new mongoose.Types.ObjectId(),
        ...permissionData,
        save: jest.fn().mockResolvedValue(true),
      }

      ;(Permission as any).mockImplementation(() => mockPermission)

      const result = await PermissionService.createPermission(permissionData)

      expect(result).toBeDefined()
      expect(result.name).toBe(permissionData.name)
    })
  })

  describe('getPermissionsByCategory', () => {
    it('should group permissions by category', async () => {
      const mockPermissions = [
        { name: 'patients.create', category: 'patients' },
        { name: 'patients.edit', category: 'patients' },
        { name: 'appointments.create', category: 'appointments' },
      ]

      ;(Permission.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPermissions),
      })

      const result = await PermissionService.getPermissionsByCategory()

      expect(result).toBeDefined()
      expect(result.patients).toHaveLength(2)
      expect(result.appointments).toHaveLength(1)
    })
  })
})

