// tests/unit/controllers/authController.test.js
const { createMockReq, createMockRes, createMockNext } = require("../../helpers/mockExpress")

describe("authController", () => {
    let authController
    let keycloakService

    beforeEach(() => {
        jest.resetModules()

        keycloakService = {
            loginUser: jest.fn(),
            createKeycloakUser: jest.fn(),
            findKeycloakUserByUsername: jest.fn(),
            getKeycloakClient: jest.fn(),
            getClientRole: jest.fn(),
            assignClientRole: jest.fn()
        }

        jest.doMock("../../../src/services/keycloakService", () => keycloakService)
        authController = require("../../../src/controllers/authController")
    })

    describe("login", () => {
        it("retorna tokens si las credenciales son válidas", async () => {
            const tokens = {
                access_token: "acc-token",
                refresh_token: "ref-token",
                expires_in: 300
            }
            keycloakService.loginUser.mockResolvedValue(tokens)

            const req = createMockReq({ body: { username: "user", password: "pass" } })
            const res = createMockRes()
            const next = createMockNext()

            await authController.login(req, res, next)

            expect(keycloakService.loginUser).toHaveBeenCalledWith("user", "pass")
            expect(res.json).toHaveBeenCalledWith({
                access_token: "acc-token",
                refresh_token: "ref-token",
                expires_in: 300
            })
        })

        it("lanza BadRequestError si falta username", async () => {
            const req = createMockReq({ body: { password: "pass" } })
            const res = createMockRes()
            const next = createMockNext()

            await authController.login(req, res, next)

            expect(next).toHaveBeenCalled()
            expect(next.mock.calls[0][0].message).toBe("username and password are required")
        })

        it("lanza BadRequestError si falta password", async () => {
            const req = createMockReq({ body: { username: "user" } })
            const res = createMockRes()
            const next = createMockNext()

            await authController.login(req, res, next)

            expect(next).toHaveBeenCalled()
            expect(next.mock.calls[0][0].message).toBe("username and password are required")
        })

        it("pasa errores de keycloak a next", async () => {
            const error = new Error("Keycloak down")
            keycloakService.loginUser.mockRejectedValue(error)

            const req = createMockReq({ body: { username: "user", password: "pass" } })
            const res = createMockRes()
            const next = createMockNext()

            await authController.login(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("register", () => {
        it("registra usuario con rol por defecto", async () => {
            keycloakService.createKeycloakUser.mockResolvedValue()
            keycloakService.findKeycloakUserByUsername.mockResolvedValue([{ id: "user-1" }])
            keycloakService.getKeycloakClient.mockResolvedValue({ id: "client-1" })
            keycloakService.getClientRole.mockResolvedValue({ id: "role-1", name: "user" })
            keycloakService.assignClientRole.mockResolvedValue()

            const req = createMockReq({
                body: { username: "newuser", email: "new@test.com", password: "secret" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(keycloakService.createKeycloakUser).toHaveBeenCalledWith({
                username: "newuser",
                email: "new@test.com",
                password: "secret"
            })
            expect(keycloakService.getClientRole).toHaveBeenCalledWith("client-1", "user")
            expect(keycloakService.assignClientRole).toHaveBeenCalledWith(
                "user-1", "client-1", { id: "role-1", name: "user" }
            )
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                message: "User registered successfully",
                username: "newuser",
                role: "user"
            })
        })

        it("registra usuario con rol admin", async () => {
            keycloakService.createKeycloakUser.mockResolvedValue()
            keycloakService.findKeycloakUserByUsername.mockResolvedValue([{ id: "user-1" }])
            keycloakService.getKeycloakClient.mockResolvedValue({ id: "client-1" })
            keycloakService.getClientRole.mockResolvedValue({ id: "role-2", name: "admin" })
            keycloakService.assignClientRole.mockResolvedValue()

            const req = createMockReq({
                body: { username: "admin", email: "admin@test.com", password: "secret", role: "admin" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(keycloakService.getClientRole).toHaveBeenCalledWith("client-1", "admin")
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }))
        })

        it("ignora rol inválido y usa 'user' por defecto", async () => {
            keycloakService.createKeycloakUser.mockResolvedValue()
            keycloakService.findKeycloakUserByUsername.mockResolvedValue([{ id: "user-1" }])
            keycloakService.getKeycloakClient.mockResolvedValue({ id: "client-1" })
            keycloakService.getClientRole.mockResolvedValue({ id: "role-1", name: "user" })
            keycloakService.assignClientRole.mockResolvedValue()

            const req = createMockReq({
                body: { username: "newuser", email: "new@test.com", password: "secret", role: "invalid" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(keycloakService.getClientRole).toHaveBeenCalledWith("client-1", "user")
        })

        it("lanza BadRequestError si falta username", async () => {
            const req = createMockReq({ body: { email: "test@test.com", password: "pass" } })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(next.mock.calls[0][0].message).toBe("username, email and password are required")
        })

        it("lanza BadRequestError si falta email", async () => {
            const req = createMockReq({ body: { username: "user", password: "pass" } })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(next.mock.calls[0][0].message).toBe("username, email and password are required")
        })

        it("lanza BadRequestError si falta password", async () => {
            const req = createMockReq({ body: { username: "user", email: "test@test.com" } })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(next.mock.calls[0][0].message).toBe("username, email and password are required")
        })

        it("lanza AppError si no encuentra usuario creado", async () => {
            keycloakService.createKeycloakUser.mockResolvedValue()
            keycloakService.findKeycloakUserByUsername.mockResolvedValue([])

            const req = createMockReq({
                body: { username: "newuser", email: "new@test.com", password: "secret" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(next.mock.calls[0][0].message).toBe("User created but could not be found")
        })

        it("pasa errores de keycloak a next", async () => {
            const error = new Error("Keycloak error")
            keycloakService.createKeycloakUser.mockRejectedValue(error)

            const req = createMockReq({
                body: { username: "user", email: "test@test.com", password: "pass" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await authController.register(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})