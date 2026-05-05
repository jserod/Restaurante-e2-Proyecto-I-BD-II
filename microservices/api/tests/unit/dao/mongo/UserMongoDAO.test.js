const { createMockCollection, createMockDb, createMockGetDb } = require("../../../helpers/mockMongo")

describe("UserMongoDAO", () => {
    let UserMongoDAO
    let mockCollection
    let mockDb
    let mockGetDb

    beforeEach(() => {
        jest.resetModules()

        mockCollection = createMockCollection()
        mockDb = createMockDb(mockCollection)
        mockGetDb = createMockGetDb(mockDb)

        jest.doMock("../../../../src/config/database", () => mockGetDb)
        UserMongoDAO = require("../../../../src/dao/mongo/UserMongoDAO")
    })

    describe("getAllUsers", () => {
        it("retorna todos los usuarios con proyección limitada", async () => {
            const users = [
                { _id: "1", keycloak_id: "kc1", email: "a@test.com", name: "Ana", role: "client" },
                { _id: "2", keycloak_id: "kc2", email: "b@test.com", name: "Bob", role: "admin" }
            ]
            mockCollection.toArray.mockResolvedValue(users)

            const dao = new UserMongoDAO()
            const result = await dao.getAllUsers()

            expect(mockDb.collection).toHaveBeenCalledWith("users")
            expect(mockCollection.find).toHaveBeenCalledWith({}, {
                projection: { keycloak_id: 1, email: 1, name: 1, role: 1 }
            })
            expect(result).toEqual(users)
        })
    })

    describe("getUserById", () => {
        it("retorna usuario por id", async () => {
            const user = { _id: "507f1f77bcf86cd799439011", name: "Ana" }
            mockCollection.findOne.mockResolvedValue(user)

            const dao = new UserMongoDAO()
            const result = await dao.getUserById("507f1f77bcf86cd799439011")

            expect(mockCollection.findOne).toHaveBeenCalledWith({
                _id: expect.any(Object)
            })
            expect(result).toEqual(user)
        })
    })

    describe("getUserByKeycloakId", () => {
        it("retorna usuario por keycloak_id", async () => {
            const user = { _id: "1", keycloak_id: "kc-123", name: "Ana" }
            mockCollection.findOne.mockResolvedValue(user)

            const dao = new UserMongoDAO()
            const result = await dao.getUserByKeycloakId("kc-123")

            expect(mockCollection.findOne).toHaveBeenCalledWith({ keycloak_id: "kc-123" })
            expect(result).toEqual(user)
        })
    })

    describe("getUserByEmail", () => {
        it("retorna usuario por email", async () => {
            const user = { _id: "1", email: "ana@test.com", name: "Ana" }
            mockCollection.findOne.mockResolvedValue(user)

            const dao = new UserMongoDAO()
            const result = await dao.getUserByEmail("ana@test.com")

            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: "ana@test.com" })
            expect(result).toEqual(user)
        })
    })

    describe("createUser", () => {
        it("crea usuario con role por defecto", async () => {
            const insertedId = "507f1f77bcf86cd799439011"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            const created = { _id: insertedId, keycloak_id: "kc-123", email: "ana@test.com", name: "Ana", role: "client" }
            mockCollection.findOne.mockResolvedValue(created)

            const dao = new UserMongoDAO()
            const result = await dao.createUser({
                keycloakId: "kc-123",
                email: "ana@test.com",
                name: "Ana"
            })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                keycloak_id: "kc-123",
                email: "ana@test.com",
                name: "Ana",
                role: "client",
                created_at: expect.any(Date)
            }))
            expect(result).toEqual(created)
        })

        it("crea usuario con role explícito", async () => {
            const insertedId = "507f1f77bcf86cd799439012"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            mockCollection.findOne.mockResolvedValue({ _id: insertedId, role: "admin" })

            const dao = new UserMongoDAO()
            await dao.createUser({
                keycloakId: "kc-456",
                email: "admin@test.com",
                name: "Admin",
                role: "admin"
            })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                role: "admin"
            }))
        })
    })

    describe("updateUser", () => {
        it("actualiza name y email", async () => {
            const updated = { _id: "1", keycloak_id: "kc-123", name: "Ana Updated", email: "new@test.com" }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new UserMongoDAO()
            const result = await dao.updateUser("kc-123", { name: "Ana Updated", email: "new@test.com" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { keycloak_id: "kc-123" },
                { $set: { name: "Ana Updated", email: "new@test.com" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })

        it("actualiza solo name", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new UserMongoDAO()
            await dao.updateUser("kc-123", { name: "Solo name" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { keycloak_id: "kc-123" },
                { $set: { name: "Solo name" } },
                { returnDocument: "after" }
            )
        })

        it("actualiza solo email", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new UserMongoDAO()
            await dao.updateUser("kc-123", { email: "solo@email.com" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { keycloak_id: "kc-123" },
                { $set: { email: "solo@email.com" } },
                { returnDocument: "after" }
            )
        })
    })

    describe("deleteUser", () => {
        it("elimina usuario por id", async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 })

            const dao = new UserMongoDAO()
            await dao.deleteUser("507f1f77bcf86cd799439011")

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({
                _id: expect.any(Object)
            })
        })
    })
})