// src/__tests__/controllers/role.controller.test.ts
import { Request, Response } from 'express'
import { createRole, getAllRoles } from '../../controllers/role.controller'
import { RoleService } from '../../services/role.service'

jest.mock('../../services/role.service')
jest.mock('../../services/audit.service')

describe('Role Controller', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>

  beforeEach(() => {
    mockReq = {
      user: { _id: 'user123' },
      body: { name: 'Test Role', description: 'Test' },
    }

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const mockRole = {
        _id: 'role123',
        name: 'Test Role',
        description: 'Test',
      }

      ;(RoleService.createRole as jest.Mock).mockResolvedValue(mockRole)

      await createRole(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalled()
    })
  })

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = {
        roles: [{ _id: '1', name: 'Role 1' }],
        total: 1,
      }

      ;(RoleService.getAllRoles as jest.Mock).mockResolvedValue(mockRoles)

      await getAllRoles(mockReq as Request, mockRes as Response)

      expect(mockRes.json).toHaveBeenCalled()
    })
  })
})

