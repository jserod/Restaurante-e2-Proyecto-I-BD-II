const attachUser = require("../../../src/middlewares/attachUser")
const userService = require("../../../src/services/userService")

jest.mock("../../../src/services/userService")

describe("attachUser", () => {
    let req, res, next

    beforeEach(() => {
        req = {
            kauth: {
                grant: {
                    access_token: {
                        content: {
                            sub: "keycloak-123",
                            email: "test@test.com",
                            preferred_username: "testuser"
                        }
                    }
                }
            }
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    test("adjunta usuario al request cuando el token es válido", async () => {
        const mockUser = { id: 1, name: "testuser", email: "test@test.com" }
        userService.findOrCreateUser.mockResolvedValue(mockUser)

        await attachUser(req, res, next)

        expect(userService.findOrCreateUser).toHaveBeenCalledWith({
            keycloakId: "keycloak-123",
            email: "test@test.com",
            name: "testuser"
        })
        expect(req.user).toEqual({ ...mockUser, dbId: mockUser.id })
        expect(next).toHaveBeenCalled()
    })

    test("retorna 401 si no hay token", async () => {
        req.kauth = undefined

        await attachUser(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" })
        expect(next).not.toHaveBeenCalled()
    })

    test("retorna 401 si kauth existe pero no tiene token", async () => {
        req.kauth = { grant: null }

        await attachUser(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" })
    })

    test("llama next con error si userService falla", async () => {
        const error = new Error("DB error")
        userService.findOrCreateUser.mockRejectedValue(error)

        await attachUser(req, res, next)

        expect(next).toHaveBeenCalledWith(error)
    })
})