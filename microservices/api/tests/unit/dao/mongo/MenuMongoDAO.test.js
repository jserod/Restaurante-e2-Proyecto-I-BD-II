// tests/unit/dao/mongo/MenuMongoDAO.test.js
const { createMockCollection, createMockDb, createMockGetDb } = require("../../../helpers/mockMongo")

describe("MenuMongoDAO", () => {
    let MenuMongoDAO
    let mockCollection
    let mockDb
    let mockGetDb

    beforeEach(() => {
        jest.resetModules()

        mockCollection = createMockCollection()
        mockDb = createMockDb(mockCollection)
        mockGetDb = createMockGetDb(mockDb)

        jest.doMock("../../../../src/config/database", () => mockGetDb)
        MenuMongoDAO = require("../../../../src/dao/mongo/MenuMongoDAO")
    })

    describe("getAll", () => {
        it("retorna todos los menus ordenados", async () => {
            const menus = [{ _id: "1", name: "Menu 1" }, { _id: "2", name: "Menu 2" }]
            mockCollection.toArray.mockResolvedValue(menus)

            const dao = new MenuMongoDAO()
            const result = await dao.getAll()

            expect(mockDb.collection).toHaveBeenCalledWith("menus")
            expect(mockCollection.find).toHaveBeenCalled()
            expect(mockCollection.sort).toHaveBeenCalledWith({ _id: 1 })
            expect(result).toEqual(menus)
        })
    })

    describe("getById", () => {
        it("retorna menu por id", async () => {
            const menu = { _id: "507f1f77bcf86cd799439011", name: "Menu 1" }
            mockCollection.findOne.mockResolvedValue(menu)

            const dao = new MenuMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(mockCollection.findOne).toHaveBeenCalledWith({
                _id: expect.any(Object) // ObjectId
            })
            expect(result).toEqual(menu)
        })

        it("retorna null si no existe", async () => {
            mockCollection.findOne.mockResolvedValue(null)

            const dao = new MenuMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd7994390ff")

            expect(result).toBeNull()
        })
    })

    describe("getByRestaurant", () => {
        it("retorna menus por restaurante", async () => {
            const menus = [{ _id: "1", restaurant_id: 10 }]
            mockCollection.toArray.mockResolvedValue(menus)

            const dao = new MenuMongoDAO()
            const result = await dao.getByRestaurant("10")

            expect(mockCollection.find).toHaveBeenCalledWith({ restaurant_id: 10 })
            expect(mockCollection.sort).toHaveBeenCalledWith({ _id: 1 })
            expect(result).toEqual(menus)
        })
    })

    describe("create", () => {
        it("crea menu con description", async () => {
            const insertedId = "new-id"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            const created = { _id: insertedId, name: "Nuevo" }
            mockCollection.findOne.mockResolvedValue(created)

            const dao = new MenuMongoDAO()
            const result = await dao.create({ restaurantId: "10", name: "Nuevo", description: "Desc" })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                restaurant_id: 10,
                name: "Nuevo",
                description: "Desc",
                created_at: expect.any(Date)
            }))
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: insertedId })
            expect(result).toEqual(created)
        })

        it("crea menu sin description (null)", async () => {
            const insertedId = "new-id"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            mockCollection.findOne.mockResolvedValue({ _id: insertedId })

            const dao = new MenuMongoDAO()
            await dao.create({ restaurantId: "10", name: "Nuevo" })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                description: null
            }))
        })
    })

    describe("update", () => {
        it("actualiza name y description", async () => {
            const updated = { _id: "507f1f77bcf86cd799439011", name: "Updated", description: "New" }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new MenuMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", { name: "Updated", description: "New" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { $set: { name: "Updated", description: "New" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })

        it("actualiza solo name", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new MenuMongoDAO()
            await dao.update("507f1f77bcf86cd799439011", { name: "Updated" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { name: "Updated" } },
                expect.any(Object)
            )
        })

        it("actualiza solo description sin pasar name", async () => {
            const updated = { _id: "507f1f77bcf86cd799439011", description: "Solo desc" }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new MenuMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", { description: "Solo desc" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { $set: { description: "Solo desc" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })
    })

    describe("delete", () => {
        it("elimina menu", async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 })

            const dao = new MenuMongoDAO()
            await dao.delete("507f1f77bcf86cd799439011")

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({
                _id: expect.any(Object)
            })
        })
    })
})