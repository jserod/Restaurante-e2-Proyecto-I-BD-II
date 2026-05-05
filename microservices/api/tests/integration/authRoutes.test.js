const request = require("supertest")
const express = require("express")

describe("Auth Routes", () => {
    let app
    let mockKeycloakService

    beforeEach(() => {
        jest.resetModules()

        mockKeycloakService = {
            loginUser: jest.fn(),
            createKeycloakUser: jest.fn(),
            findKeycloakUserByUsername: jest.fn(),
            getKeycloakClient: jest.fn(),
            getClientRole: jest.fn(),
            assignClientRole: jest.fn()
        }

        jest.doMock("../../src/services/keycloakService", () => mockKeycloakService)

        const authRoutes = require("../../src/routes/authRoutes")
        
        app = express()
        app.use(express.json())
        app.use("/auth", authRoutes)
        
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message })
        })
    })

    describe("POST /auth/login", () => {
        it("retorna tokens si las credenciales son válidas", async () => {
            const tokens = {
                access_token: "abc123",
                refresh_token: "def456",
                expires_in: 300
            }
            mockKeycloakService.loginUser.mockResolvedValue(tokens)

            const res = await request(app)
                .post("/auth/login")
                .send({ username: "user", password: "pass" })

            expect(res.status).toBe(200)
            expect(res.body).toEqual({
                access_token: "abc123",
                refresh_token: "def456",
                expires_in: 300
            })
            expect(mockKeycloakService.loginUser).toHaveBeenCalledWith("user", "pass")
        })

        it("retorna 400 si faltan credenciales", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({ username: "user" })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("username and password are required")
        })
    })

    describe("POST /auth/register", () => {
        it("registra usuario con role por defecto", async () => {
            mockKeycloakService.createKeycloakUser.mockResolvedValue()
            mockKeycloakService.findKeycloakUserByUsername.mockResolvedValue([{ id: "user-1" }])
            mockKeycloakService.getKeycloakClient.mockResolvedValue({ id: "client-1" })
            mockKeycloakService.getClientRole.mockResolvedValue({ id: "role-1", name: "user" })
            mockKeycloakService.assignClientRole.mockResolvedValue()

            const res = await request(app)
                .post("/auth/register")
                .send({
                    username: "newuser",
                    email: "new@test.com",
                    password: "secret"
                })

            expect(res.status).toBe(201)
            expect(res.body.message).toBe("User registered successfully")
            expect(res.body.role).toBe("user")
            expect(mockKeycloakService.createKeycloakUser).toHaveBeenCalledWith({
                username: "newuser",
                email: "new@test.com",
                password: "secret"
            })
        })

        it("registra usuario con role admin", async () => {
            mockKeycloakService.createKeycloakUser.mockResolvedValue()
            mockKeycloakService.findKeycloakUserByUsername.mockResolvedValue([{ id: "user-1" }])
            mockKeycloakService.getKeycloakClient.mockResolvedValue({ id: "client-1" })
            mockKeycloakService.getClientRole.mockResolvedValue({ id: "role-1", name: "admin" })
            mockKeycloakService.assignClientRole.mockResolvedValue()

            const res = await request(app)
                .post("/auth/register")
                .send({
                    username: "adminuser",
                    email: "admin@test.com",
                    password: "secret",
                    role: "admin"
                })

            expect(res.status).toBe(201)
            expect(res.body.role).toBe("admin")
        })

        it("retorna 400 si faltan campos requeridos", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({ username: "user" })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("username, email and password are required")
        })
    })
})