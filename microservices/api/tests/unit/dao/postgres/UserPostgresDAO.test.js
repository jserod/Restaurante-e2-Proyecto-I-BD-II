// tests/unit/dao/postgres/UserPostgresDAO.test.js
const { createMockPool } = require("../../../helpers/mockPool")

describe("UserPostgresDAO", () => {
    let UserPostgresDAO
    let mockPool

    beforeEach(() => {
        jest.resetModules()

        const mocks = createMockPool()
        mockPool = mocks.mockPool

        jest.doMock("../../../../src/config/database", () => mockPool)
        UserPostgresDAO = require("../../../../src/dao/postgres/UserPostgresDAO")
    })

    describe("getAllUsers", () => {
        it("retorna todos los usuarios", async () => {
            const users = [
                { id: 1, keycloak_id: "kc-1", email: "u1@test.com", name: "User 1", role: "client" },
                { id: 2, keycloak_id: "kc-2", email: "u2@test.com", name: "User 2", role: "admin" }
            ]
            mockPool.query.mockResolvedValue({ rows: users })

            const dao = new UserPostgresDAO()
            const result = await dao.getAllUsers()

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT id, keycloak_id, email, name, role FROM users ORDER BY id"
            )
            expect(result).toEqual(users)
        })
    })

    describe("getUserById", () => {
        it("retorna usuario por id", async () => {
            const user = { id: 1, keycloak_id: "kc-1", email: "u1@test.com", name: "User 1", role: "client" }
            mockPool.query.mockResolvedValue({ rows: [user] })

            const dao = new UserPostgresDAO()
            const result = await dao.getUserById(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT id, keycloak_id, email, name, role FROM users WHERE id = $1",
                [1]
            )
            expect(result).toEqual(user)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new UserPostgresDAO()
            const result = await dao.getUserById(999)

            expect(result).toBeUndefined()
        })
    })

    describe("createUser", () => {
        it("crea usuario con role explícito", async () => {
            const created = { id: 1, keycloak_id: "kc-1", email: "u1@test.com", name: "User 1", role: "admin" }
            mockPool.query.mockResolvedValue({ rows: [created] })

            const dao = new UserPostgresDAO()
            const result = await dao.createUser({
                keycloakId: "kc-1",
                email: "u1@test.com",
                name: "User 1",
                role: "admin"
            })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO users"),
                ["kc-1", "u1@test.com", "User 1", "admin"]
            )
            expect(result).toEqual(created)
        })

        it("usa 'client' como role por defecto", async () => {
            const created = { id: 1, keycloak_id: "kc-1", email: "u1@test.com", name: "User 1", role: "client" }
            mockPool.query.mockResolvedValue({ rows: [created] })

            const dao = new UserPostgresDAO()
            await dao.createUser({
                keycloakId: "kc-1",
                email: "u1@test.com",
                name: "User 1"
            })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.any(String),
                ["kc-1", "u1@test.com", "User 1", "client"]
            )
        })
    })

    describe("updateUser", () => {
        it("actualiza name y email", async () => {
            const updated = { id: 1, keycloak_id: "kc-1", email: "new@test.com", name: "New Name", role: "client" }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new UserPostgresDAO()
            const result = await dao.updateUser("kc-1", { name: "New Name", email: "new@test.com" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE users"),
                ["New Name", "new@test.com", "kc-1"]
            )
            expect(result).toEqual(updated)
        })
    })

    describe("deleteUser", () => {
        it("elimina usuario por id", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new UserPostgresDAO()
            await dao.deleteUser(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                "DELETE FROM users WHERE id = $1",
                [1]
            )
        })
    })

    describe("getUserByKeycloakId", () => {
        it("retorna usuario por keycloakId", async () => {
            const user = { id: 1, keycloak_id: "kc-1", email: "u1@test.com" }
            mockPool.query.mockResolvedValue({ rows: [user] })

            const dao = new UserPostgresDAO()
            const result = await dao.getUserByKeycloakId("kc-1")

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM users WHERE keycloak_id = $1",
                ["kc-1"]
            )
            expect(result).toEqual(user)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new UserPostgresDAO()
            const result = await dao.getUserByKeycloakId("kc-999")

            expect(result).toBeUndefined()
        })
    })

    describe("getUserByEmail", () => {
        it("retorna usuario por email", async () => {
            const user = { id: 1, keycloak_id: "kc-1", email: "u1@test.com" }
            mockPool.query.mockResolvedValue({ rows: [user] })

            const dao = new UserPostgresDAO()
            const result = await dao.getUserByEmail("u1@test.com")

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM users WHERE email = $1",
                ["u1@test.com"]
            )
            expect(result).toEqual(user)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new UserPostgresDAO()
            const result = await dao.getUserByEmail("no@test.com")

            expect(result).toBeUndefined()
        })
    })
})