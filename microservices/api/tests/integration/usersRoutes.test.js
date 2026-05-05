const request = require("supertest")
const express = require("express")
const { NotFoundError } = require("../../src/errors")

describe("Users Routes", () => {
    let app
    let mockKeycloakService
    let mockUserService

    beforeEach(() => {
        jest.resetModules()

        mockKeycloakService = {
            getAllKeycloakUsers: jest.fn(),
            updateKeycloakUser: jest.fn(),
            deleteKeycloakUser: jest.fn()
        }

        mockUserService = {
            findOrCreateUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn()
        }

        jest.doMock("../../src/services/keycloakService", () => mockKeycloakService)
        jest.doMock("../../src/services/userService", () => mockUserService)

        jest.doMock("../../src/middlewares/keycloakProtect", () => {
            return () => (req, res, next) => {
                req.kauth = {
                    grant: {
                        access_token: {
                            content: {
                                sub: "test-keycloak-id",
                                email: "test@test.com",
                                preferred_username: "testuser",
                                resource_access: { "restaurant-api": { roles: ["admin"] } },
                                realm_access: { roles: ["admin"] }
                            }
                        }
                    }
                }
                next()
            }
        })

        jest.doMock("../../src/middlewares/requireRole", () => {
            return () => (req, res, next) => next()
        })

        const usersRoutes = require("../../src/routes/usersRoutes")
        
        app = express()
        app.use(express.json())
        app.use("/users", usersRoutes)
        
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message })
        })
    })

    describe("GET /users", () => {
        it("retorna todos los usuarios", async () => {
            const users = [
                { id: "1", username: "user1", email: "u1@test.com", enabled: true }
            ]
            mockKeycloakService.getAllKeycloakUsers.mockResolvedValue(users)

            const res = await request(app).get("/users")

            expect(res.status).toBe(200)
            expect(res.body).toEqual([
                { id: "1", username: "user1", email: "u1@test.com", enabled: true }
            ])
            expect(mockKeycloakService.getAllKeycloakUsers).toHaveBeenCalled()
        })
    })

    describe("GET /users/me", () => {
        it("retorna usuario autenticado", async () => {
            const user = { id: "1", name: "testuser", email: "test@test.com" }
            mockUserService.findOrCreateUser.mockResolvedValue(user)

            const res = await request(app).get("/users/me")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(user)
            expect(mockUserService.findOrCreateUser).toHaveBeenCalledWith({
                keycloakId: "test-keycloak-id",
                email: "test@test.com",
                name: "testuser"
            })
        })
    })

    describe("PUT /users/:id", () => {
        it("actualiza usuario con email", async () => {
            mockKeycloakService.updateKeycloakUser.mockResolvedValue()
            mockUserService.updateUser.mockResolvedValue({ id: "1", email: "new@test.com" })

            const res = await request(app)
                .put("/users/test-keycloak-id")
                .send({ email: "new@test.com" })

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("User updated")
            expect(mockKeycloakService.updateKeycloakUser).toHaveBeenCalledWith("test-keycloak-id", {
                email: "new@test.com"
            })
            expect(mockUserService.updateUser).toHaveBeenCalledWith("test-keycloak-id", {
                email: "new@test.com",
                name: undefined
            })
        })

        it("actualiza usuario con firstName y lastName", async () => {
            mockKeycloakService.updateKeycloakUser.mockResolvedValue()
            mockUserService.updateUser.mockResolvedValue({ id: "1", name: "John Doe" })

            const res = await request(app)
                .put("/users/test-keycloak-id")
                .send({ firstName: "John", lastName: "Doe" })

            expect(res.status).toBe(200)
            expect(mockKeycloakService.updateKeycloakUser).toHaveBeenCalledWith("test-keycloak-id", {
                firstName: "John",
                lastName: "Doe"
            })
            expect(mockUserService.updateUser).toHaveBeenCalledWith("test-keycloak-id", {
                email: undefined,
                name: "John Doe"
            })
        })

        it("retorna 400 si no hay campos validos", async () => {
            const res = await request(app)
                .put("/users/test-keycloak-id")
                .send({})

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("No valid fields to update")
        })

        it("retorna 404 si usuario no existe en keycloak", async () => {
            mockKeycloakService.updateKeycloakUser.mockRejectedValue(new NotFoundError("User not found"))

            const res = await request(app)
                .put("/users/noexiste")
                .send({ email: "new@test.com" })

            expect(res.status).toBe(404)
        })
    })

    describe("DELETE /users/:id", () => {
        it("elimina usuario", async () => {
            mockKeycloakService.deleteKeycloakUser.mockResolvedValue()
            mockUserService.deleteUser.mockResolvedValue()

            const res = await request(app).delete("/users/test-keycloak-id")

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("User deleted")
            expect(mockKeycloakService.deleteKeycloakUser).toHaveBeenCalledWith("test-keycloak-id")
            expect(mockUserService.deleteUser).toHaveBeenCalledWith("test-keycloak-id")
        })

        it("retorna 404 si usuario no existe en keycloak", async () => {
            mockKeycloakService.deleteKeycloakUser.mockRejectedValue(new NotFoundError("User not found"))

            const res = await request(app).delete("/users/noexiste")

            expect(res.status).toBe(404)
        })

        it("retorna 404 si usuario no existe en BD local", async () => {
            mockKeycloakService.deleteKeycloakUser.mockResolvedValue()
            mockUserService.deleteUser.mockRejectedValue(new NotFoundError("User not found"))

            const res = await request(app).delete("/users/test-keycloak-id")

            expect(res.status).toBe(404)
        })
    })
})