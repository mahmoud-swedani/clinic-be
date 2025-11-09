// src/__tests__/services/role.service.test.ts
import { RoleService } from '../../services/role.service'
import { Role } from '../../models/role.model'
import mongoose from 'mongoose'

// Mock mongoose models
jest.mock('../../models/role.model')
jest.mock('../../models/user.model')
jest.mock('../../models/rolePermission.model')

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createRole', () => {
    it('should create a new role', async () => {
      const roleData = {
        name: 'Test Role',
        description: 'Test Description',
        isSystemRole: false,
        createdBy: new mongoose.Types.ObjectId(),
      }

      const mockRole = {
        _id: new mongoose.Types.ObjectId(),
        ...roleData,
        save: jest.fn().mockResolvedValue(true),
      }

      ;(Role as any).mockImplementation(() => mockRole)

      const result = await RoleService.createRole(roleData)

      expect(result).toBeDefined()
      expect(result.name).toBe(roleData.name)
    })
  })

  describe('getAllRoles', () => {
    it('should return paginated roles', async () => {
      const mockRoles = [
        { _id: '1', name: 'Role 1' },
        { _id: '2', name: 'Role 2' },
      ]

      ;(Role.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockRoles),
      })

      ;(Role.countDocuments as any).mockResolvedValue(2)

      const result = await RoleService.getAllRoles(1, 10)

      expect(result.roles).toHaveLength(2)
      expect(result.total).toBe(2)
    })
  })
})

