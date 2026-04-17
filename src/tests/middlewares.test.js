jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn()
}))

jest.mock('../config/keycloak', () => ({
  keycloak: {
    protect: jest.fn(() => (req, res, next) => next()),
    middleware: jest.fn(() => (req, res, next) => next())
  },
  memoryStore: { on: jest.fn() }
}))

jest.mock('../models/users')

const attachUser = require('../middlewares/attachUser')
const requireRole = require('../middlewares/requireRole')
const usersModel = require('../models/users')

describe('Middleware Tests', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: 'key123',
              email: 'a@b.com',
              preferred_username: 'user'
            }
          }
        }
      }
    }
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    next = jest.fn()
    jest.clearAllMocks()
  })

  describe('attachUser', () => {
    it('should find or create user and attach to req.user', async () => {
      const mockUser = { id: 1, keycloak_id: 'key123', email: 'a@b.com', name: 'user' }
      usersModel.findOrCreateUser.mockResolvedValue(mockUser)
      await attachUser(req, res, next)
      expect(usersModel.findOrCreateUser).toHaveBeenCalledWith({
        keycloakId: 'key123',
        email: 'a@b.com',
        name: 'user'
      })
      expect(req.user).toEqual({ ...mockUser, dbId: 1 })
      expect(next).toHaveBeenCalled()
    })

    it('should return 401 if no token', async () => {
      req.kauth = null
      await attachUser(req, res, next)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with error if model throws', async () => {
      const error = new Error('DB error')
      usersModel.findOrCreateUser.mockRejectedValue(error)
      await attachUser(req, res, next)
      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('requireRole', () => {
    it('should call next if user has required role', () => {
      req.kauth = {
        grant: {
          access_token: {
            content: {
              resource_access: { 'restaurant-api': { roles: ['admin'] } }
            }
          }
        }
      }
      requireRole('admin')(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should return 403 if user lacks required role', () => {
      req.kauth = {
        grant: {
          access_token: {
            content: {
              resource_access: { 'restaurant-api': { roles: ['user'] } }
            }
          }
        }
      }
      requireRole('admin')(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 if no token', () => {
      req.kauth = null
      requireRole('admin')(req, res, next)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should check realm roles as fallback', () => {
      req.kauth = {
        grant: {
          access_token: {
            content: {
              realm_access: { roles: ['admin'] }
            }
          }
        }
      }
      requireRole('admin')(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })
})