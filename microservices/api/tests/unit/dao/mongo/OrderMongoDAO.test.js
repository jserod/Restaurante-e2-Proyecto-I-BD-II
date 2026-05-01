// tests/unit/dao/mongo/OrderMongoDAO.test.js
const { createMockCollection, createMockDb, createMockGetDb } = require("../../../helpers/mockMongo")

describe("OrderMongoDAO", () => {
    let OrderMongoDAO
    let mockCollection
    let mockMenusCollection
    let mockDb
    let mockGetDb

    beforeEach(() => {
        jest.resetModules()

        mockCollection = createMockCollection()
        mockMenusCollection = createMockCollection()
        mockDb = createMockDb(mockCollection)
        mockDb.collection.mockImplementation((name) => {
            if (name === "menus") return mockMenusCollection
            return mockCollection
        })
        mockGetDb = createMockGetDb(mockDb)

        jest.doMock("../../../../src/config/database", () => mockGetDb)
        OrderMongoDAO = require("../../../../src/dao/mongo/OrderMongoDAO")
    })

    describe("getAll", () => {
        it("retorna todas las ordenes ordenadas", async () => {
            const orders = [
                { _id: "1", status: "pending" },
                { _id: "2", status: "completed" }
            ]
            mockCollection.toArray.mockResolvedValue(orders)

            const dao = new OrderMongoDAO()
            const result = await dao.getAll()

            expect(mockDb.collection).toHaveBeenCalledWith("orders")
            expect(mockCollection.find).toHaveBeenCalled()
            expect(mockCollection.sort).toHaveBeenCalledWith({ _id: 1 })
            expect(result).toEqual(orders)
        })
    })

    describe("getById", () => {
        it("retorna orden por id", async () => {
            const order = { _id: "507f1f77bcf86cd799439011", status: "pending" }
            mockCollection.findOne.mockResolvedValue(order)

            const dao = new OrderMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(mockCollection.findOne).toHaveBeenCalledWith({
                _id: expect.any(Object)
            })
            expect(result).toEqual(order)
        })
    })

    describe("create", () => {
        it("crea orden con pickup y reservationId", async () => {
            mockMenusCollection.findOne.mockResolvedValue({
                _id: "507f1f77bcf86cd799439012",
                products: [{ product_id: "p1", name: "Burger", price: 10.5 }]
            })

            const insertedId = "507f1f77bcf86cd799439011"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            const created = { _id: insertedId, status: "pending", total: 21 }
            mockCollection.findOne.mockResolvedValue(created)

            const dao = new OrderMongoDAO()
            const result = await dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                reservationId: "507f1f77bcf86cd799439015",
                pickup: true,
                items: [
                    { menuId: "507f1f77bcf86cd799439012", productId: "p1", quantity: 2 }
                ]
            })

            expect(mockMenusCollection.findOne).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { projection: { products: { $elemMatch: { product_id: "p1" } } } }
            )
            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                user_id: expect.any(Object),
                restaurant_id: expect.any(Object),
                reservation_id: expect.any(Object),
                pickup: true,
                status: "pending",
                total: 21,
                items: expect.arrayContaining([
                    expect.objectContaining({
                        menu_id: expect.any(Object),
                        product_id: "p1",
                        name: "Burger",
                        quantity: 2,
                        unit_price: 10.5
                    })
                ]),
                created_at: expect.any(Date)
            }))
            expect(result).toEqual(created)
        })

        it("crea orden sin pickup ni reservationId (valores por defecto)", async () => {
            mockMenusCollection.findOne.mockResolvedValue({
                products: [{ product_id: "p2", name: "Fries", price: 5 }]
            })

            const insertedId = "507f1f77bcf86cd799439011"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            mockCollection.findOne.mockResolvedValue({ _id: insertedId })

            const dao = new OrderMongoDAO()
            await dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                items: [
                    { menuId: "507f1f77bcf86cd799439012", productId: "p2", quantity: 1 }
                ]
            })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                reservation_id: null,
                pickup: false
            }))
        })

        it("lanza error si producto no existe en menu", async () => {
            mockMenusCollection.findOne.mockResolvedValue(null)

            const dao = new OrderMongoDAO()
            await expect(dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                items: [
                    { menuId: "507f1f77bcf86cd799439012", productId: "noexiste", quantity: 1 }
                ]
            })).rejects.toThrow("Product noexiste not found in menu 507f1f77bcf86cd799439012")
        })

        it("lanza error si menu existe pero no tiene el producto", async () => {
            mockMenusCollection.findOne.mockResolvedValue({
                products: []
            })

            const dao = new OrderMongoDAO()
            await expect(dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                items: [
                    { menuId: "507f1f77bcf86cd799439012", productId: "p1", quantity: 1 }
                ]
            })).rejects.toThrow("Product p1 not found in menu 507f1f77bcf86cd799439012")
        })
    })

    describe("update", () => {
        it("actualiza status", async () => {
            const updated = { _id: "507f1f77bcf86cd799439011", status: "completed" }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new OrderMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", { status: "completed" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { $set: { status: "completed" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })
    })

    describe("delete", () => {
        it("elimina orden por id", async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 })

            const dao = new OrderMongoDAO()
            await dao.delete("507f1f77bcf86cd799439011")

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({
                _id: expect.any(Object)
            })
        })
    })
})