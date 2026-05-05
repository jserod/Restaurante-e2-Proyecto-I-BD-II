const { createMockReq, createMockRes, createMockNext } = require("../../helpers/mockExpress")

describe("usersController", () => {
    let usersController
    let keycloakService
    let userService

    beforeEach(() => {
        jest.resetModules()

        keycloakService = {
            getAllKeycloakUsers: jest.fn(),
            updateKeycloakUser: jest.fn(),
            deleteKeycloakUser: jest.fn()
        }

        userService = {
            findOrCreateUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn()
        }

        jest.doMock("../../../src/services/keycloakService", () => keycloakService)
        jest.doMock("../../../src/services/userService", () => userService)
        usersController = require("../../../src/controllers/usersController")
    })

    describe("getUsers", () => {
        it("retorna usuarios mapeados", async () => {
            const users = [
                { id: "1", username: "user1", email: "u1@test.com", enabled: true, extra: "ignored" }
            ]
            keycloakService.getAllKeycloakUsers.mockResolvedValue(users)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await usersController.getUsers(req, res, next)

            expect(res.json).toHaveBeenCalledWith([{
                id: "1",
                username: "user1",
                email: "u1@test.com",
                enabled: true
            }])
        })

        it("pasa errores a next", async () => {
            const error = new Error("Keycloak fail")
            keycloakService.getAllKeycloakUsers.mockRejectedValue(error)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await usersController.getUsers(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getMe", () => {
        it("retorna usuario desde token", async () => {
            const user = { id: 1, keycloakId: "kc-123", name: "testuser" }
            userService.findOrCreateUser.mockResolvedValue(user)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await usersController.getMe(req, res, next)

            expect(userService.findOrCreateUser).toHaveBeenCalledWith({
                keycloakId: "kc-123",
                email: "test@test.com",
                name: "testuser"
            })
            expect(res.json).toHaveBeenCalledWith(user)
        })

        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            userService.findOrCreateUser.mockRejectedValue(error)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await usersController.getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("updateUser", () => {
        it("actualiza usuario con todos los campos", async () => {
            keycloakService.updateKeycloakUser.mockResolvedValue()
            userService.updateUser.mockResolvedValue()

            const req = createMockReq({
                params: { id: "kc-123" },
                body: { email: "new@test.com", firstName: "John", lastName: "Doe" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.updateUser(req, res, next)

            expect(keycloakService.updateKeycloakUser).toHaveBeenCalledWith("kc-123", {
                email: "new@test.com",
                firstName: "John",
                lastName: "Doe"
            })
            expect(userService.updateUser).toHaveBeenCalledWith("kc-123", {
                email: "new@test.com",
                name: "John Doe"
            })
            expect(res.json).toHaveBeenCalledWith({ message: "User updated" })
        })

        it("actualiza solo email", async () => {
            keycloakService.updateKeycloakUser.mockResolvedValue()
            userService.updateUser.mockResolvedValue()

            const req = createMockReq({
                params: { id: "kc-123" },
                body: { email: "new@test.com" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.updateUser(req, res, next)

            expect(keycloakService.updateKeycloakUser).toHaveBeenCalledWith("kc-123", {
                email: "new@test.com"
            })
            expect(userService.updateUser).toHaveBeenCalledWith("kc-123", {
                email: "new@test.com",
                name: undefined
            })
        })

        it("retorna 400 si no hay campos válidos", async () => {
            const req = createMockReq({
                params: { id: "kc-123" },
                body: { invalidField: "value" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.updateUser(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "No valid fields to update" })
            expect(keycloakService.updateKeycloakUser).not.toHaveBeenCalled()
        })

        it("pasa errores de keycloak a next", async () => {
            const error = new Error("Keycloak fail")
            keycloakService.updateKeycloakUser.mockRejectedValue(error)

            const req = createMockReq({
                params: { id: "kc-123" },
                body: { email: "new@test.com" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.updateUser(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })

        it("pasa errores de userService a next", async () => {
            keycloakService.updateKeycloakUser.mockResolvedValue()
            const error = new Error("User not found")
            userService.updateUser.mockRejectedValue(error)

            const req = createMockReq({
                params: { id: "kc-123" },
                body: { email: "new@test.com" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.updateUser(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("deleteUser", () => {
        it("elimina usuario de keycloak y BD", async () => {
            keycloakService.deleteKeycloakUser.mockResolvedValue()
            userService.deleteUser.mockResolvedValue()

            const req = createMockReq({ params: { id: "kc-123" } })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.deleteUser(req, res, next)

            expect(keycloakService.deleteKeycloakUser).toHaveBeenCalledWith("kc-123")
            expect(userService.deleteUser).toHaveBeenCalledWith("kc-123")
            expect(res.json).toHaveBeenCalledWith({ message: "User deleted" })
        })

        it("pasa errores de keycloak a next", async () => {
            const error = new Error("Keycloak fail")
            keycloakService.deleteKeycloakUser.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "kc-123" } })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.deleteUser(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })

        it("pasa errores de userService a next", async () => {
            keycloakService.deleteKeycloakUser.mockResolvedValue()
            const error = new Error("User not found")
            userService.deleteUser.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "kc-123" } })
            const res = createMockRes()
            const next = createMockNext()

            await usersController.deleteUser(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})