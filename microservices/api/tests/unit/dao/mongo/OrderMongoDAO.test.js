const { createMockCollection, createMockDb, createMockGetDb } = require("../../../helpers/mockMongo")

describe("OrderMongoDAO", () => {
    let OrderMongoDAO
    let mockOrdersCollection
    let mockRestaurantsCollection
    let mockDb
    let mockGetDb

    beforeEach(() => {
        jest.resetModules()

        mockOrdersCollection = createMockCollection()
        mockRestaurantsCollection = createMockCollection()

        mockDb = {
            collection: jest.fn((name) => {
                if (name === "orders") return mockOrdersCollection
                if (name === "restaurants") return mockRestaurantsCollection
                return mockOrdersCollection
            })
        }
        mockGetDb = jest.fn().mockResolvedValue(mockDb)

        jest.doMock("../../../../src/config/database", () => mockGetDb)
        OrderMongoDAO = require("../../../../src/dao/mongo/OrderMongoDAO")
    })

    describe("getAll", () => {
        it("retorna todas las ordenes ordenadas", async () => {
            const orders = [{ _id: "1", status: "pending" }]
            mockOrdersCollection.toArray.mockResolvedValue(orders)

            const dao = new OrderMongoDAO()
            const result = await dao.getAll()

            expect(mockDb.collection).toHaveBeenCalledWith("orders")
            expect(mockOrdersCollection.sort).toHaveBeenCalledWith({ _id: 1 })
            expect(result).toEqual(orders)
        })
    })

    describe("getById", () => {
        it("retorna orden por id", async () => {
            const order = { _id: "507f1f77bcf86cd799439011", status: "pending" }
            mockOrdersCollection.findOne.mockResolvedValue(order)

            const dao = new OrderMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(mockOrdersCollection.findOne).toHaveBeenCalledWith({
                _id: expect.any(Object)
            })
            expect(result).toEqual(order)
        })
    })

    describe("create", () => {
        it("crea orden buscando producto en restaurante", async () => {
            mockRestaurantsCollection.findOne.mockResolvedValue({
                _id: "507f1f77bcf86cd799439014",
                menus: [{
                    _id: "507f1f77bcf86cd799439012",
                    products: [{ product_id: "p1", name: "Burger", price: 10.5 }]
                }]
            })

            const insertedId = "507f1f77bcf86cd799439011"
            mockOrdersCollection.insertOne.mockResolvedValue({ insertedId })
            mockOrdersCollection.findOne.mockResolvedValue({
                _id: insertedId, status: "pending", total: 21
            })

            const dao = new OrderMongoDAO()
            const result = await dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                reservationId: "507f1f77bcf86cd799439015",
                pickup: true,
                items: [{ menuId: "507f1f77bcf86cd799439012", productId: "p1", quantity: 2 }]
            })

            expect(mockOrdersCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                user_id: expect.any(Object),
                restaurant_id: expect.any(Object),
                reservation_id: expect.any(Object),
                pickup: true,
                status: "pending",
                total: 21,
                items: expect.arrayContaining([
                    expect.objectContaining({
                        product_id: "p1",
                        name: "Burger",
                        quantity: 2,
                        unit_price: 10.5
                    })
                ])
            }))
            expect(result).toEqual(expect.objectContaining({ total: 21 }))
        })

        it("usa valores por defecto para pickup y reservationId", async () => {
            mockRestaurantsCollection.findOne.mockResolvedValue({
                menus: [{
                    _id: "507f1f77bcf86cd799439012",
                    products: [{ product_id: "p1", name: "Pizza", price: 8000 }]
                }]
            })
            mockOrdersCollection.insertOne.mockResolvedValue({ insertedId: "oid" })
            mockOrdersCollection.findOne.mockResolvedValue({ _id: "oid" })

            const dao = new OrderMongoDAO()
            await dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                items: [{ menuId: "507f1f77bcf86cd799439012", productId: "p1", quantity: 1 }]
            })

            expect(mockOrdersCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                reservation_id: null,
                pickup: false
            }))
        })

        it("lanza error si menu no encontrado en restaurante", async () => {
            mockRestaurantsCollection.findOne.mockResolvedValue(null)

            const dao = new OrderMongoDAO()
            await expect(dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                items: [{ menuId: "507f1f77bcf86cd799439012", productId: "p1", quantity: 1 }]
            })).rejects.toThrow("Menu 507f1f77bcf86cd799439012 not found in restaurant")
        })

        it("lanza error si producto no existe en el menu", async () => {
            mockRestaurantsCollection.findOne.mockResolvedValue({
                menus: [{
                    _id: "507f1f77bcf86cd799439012",
                    products: []
                }]
            })

            const dao = new OrderMongoDAO()
            await expect(dao.create({
                userId: "507f1f77bcf86cd799439013",
                restaurantId: "507f1f77bcf86cd799439014",
                items: [{ menuId: "507f1f77bcf86cd799439012", productId: "noexiste", quantity: 1 }]
            })).rejects.toThrow("Product noexiste not found in menu")
        })
    })

    describe("update", () => {
        it("actualiza status de la orden", async () => {
            const updated = { _id: "507f1f77bcf86cd799439011", status: "completed" }
            mockOrdersCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new OrderMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", { status: "completed" })

            expect(mockOrdersCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { $set: { status: "completed" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })
    })

    describe("delete", () => {
        it("elimina orden por id", async () => {
            mockOrdersCollection.deleteOne.mockResolvedValue({ deletedCount: 1 })

            const dao = new OrderMongoDAO()
            await dao.delete("507f1f77bcf86cd799439011")

            expect(mockOrdersCollection.deleteOne).toHaveBeenCalledWith({
                _id: expect.any(Object)
            })
        })
    })
})