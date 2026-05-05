const { createMockCollection, createMockDb, createMockGetDb } = require("../../../helpers/mockMongo")

describe("RestaurantMongoDAO", () => {
    let RestaurantMongoDAO
    let mockCollection
    let mockDb
    let mockGetDb

    beforeEach(() => {
        jest.resetModules()

        mockCollection = createMockCollection()
        mockDb = createMockDb(mockCollection)
        mockGetDb = createMockGetDb(mockDb)

        jest.doMock("../../../../src/config/database", () => mockGetDb)
        RestaurantMongoDAO = require("../../../../src/dao/mongo/RestaurantMongoDAO")
    })

    describe("getAll", () => {
        it("retorna todos los restaurantes", async () => {
            const restaurants = [{ _id: "1", name: "Rest 1" }]
            mockCollection.toArray.mockResolvedValue(restaurants)

            const dao = new RestaurantMongoDAO()
            const result = await dao.getAll()

            expect(mockCollection.find).toHaveBeenCalled()
            expect(mockCollection.sort).toHaveBeenCalledWith({ _id: 1 })
            expect(result).toEqual(restaurants)
        })
    })

    describe("getById", () => {
        it("retorna restaurante por id", async () => {
            const restaurant = { _id: "507f1f77bcf86cd799439011", name: "Rest 1" }
            mockCollection.findOne.mockResolvedValue(restaurant)

            const dao = new RestaurantMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(result).toEqual(restaurant)
        })
    })

    describe("create", () => {
        it("crea restaurante", async () => {
            const insertedId = "new-id"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            const created = { _id: insertedId, name: "Nuevo" }
            mockCollection.findOne.mockResolvedValue(created)

            const dao = new RestaurantMongoDAO()
            const result = await dao.create({ name: "Nuevo", description: "Desc", address: "Calle 1" })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                name: "Nuevo",
                description: "Desc",
                address: "Calle 1",
                created_at: expect.any(Date)
            }))
            expect(result).toEqual(created)
        })
    })

    describe("update", () => {
        it("actualiza campos presentes", async () => {
            const updated = { _id: "507f1f77bcf86cd799439011", name: "Updated" }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new RestaurantMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", { name: "Updated", description: "New" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { $set: { name: "Updated", description: "New" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })

        it("ignora campos undefined", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new RestaurantMongoDAO()
            await dao.update("507f1f77bcf86cd799439011", { name: "Updated" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { name: "Updated" } },
                expect.any(Object)
            )
        })

        it("actualiza address", async () => {
            const updated = { _id: "507f1f77bcf86cd799439011", address: "Calle 2" }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new RestaurantMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", { address: "Calle 2" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { $set: { address: "Calle 2" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })

        it("actualiza sin pasar name", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new RestaurantMongoDAO()
            await dao.update("507f1f77bcf86cd799439011", { description: "Solo desc" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { description: "Solo desc" } },
                expect.any(Object)
            )
        })
    })

    describe("delete", () => {
        it("elimina restaurante", async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 })

            const dao = new RestaurantMongoDAO()
            await dao.delete("507f1f77bcf86cd799439011")

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: expect.any(Object) })
        })
    })
})