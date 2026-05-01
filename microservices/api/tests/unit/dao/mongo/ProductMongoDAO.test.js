// tests/unit/dao/mongo/ProductMongoDAO.test.js
const { createMockCollection, createMockDb, createMockGetDb } = require("../../../helpers/mockMongo")

describe("ProductMongoDAO", () => {
    let ProductMongoDAO
    let mockCollection
    let mockDb
    let mockGetDb

    beforeEach(() => {
        jest.resetModules()

        mockCollection = createMockCollection()
        mockDb = createMockDb(mockCollection)
        mockGetDb = createMockGetDb(mockDb)

        jest.doMock("../../../../src/config/database", () => mockGetDb)
        ProductMongoDAO = require("../../../../src/dao/mongo/ProductMongoDAO")
    })

    describe("getAll", () => {
        it("retorna productos de todos los menus", async () => {
            const menus = [
                {
                    _id: "menu1",
                    name: "Menu 1",
                    products: [
                        { product_id: "p1", name: "Burger" },
                        { product_id: "p2", name: "Fries" }
                    ]
                },
                {
                    _id: "menu2",
                    name: "Menu 2",
                    products: [{ product_id: "p3", name: "Soda" }]
                }
            ]
            mockCollection.toArray.mockResolvedValue(menus)

            const dao = new ProductMongoDAO()
            const result = await dao.getAll()

            expect(result).toHaveLength(3)
            expect(result[0]).toEqual(expect.objectContaining({
                product_id: "p1",
                menu_id: "menu1",
                menu_name: "Menu 1"
            }))
        })

        it("retorna array vacío si no hay productos", async () => {
            mockCollection.toArray.mockResolvedValue([
                { _id: "1", name: "Menu sin productos" }
            ])

            const dao = new ProductMongoDAO()
            const result = await dao.getAll()

            expect(result).toEqual([])
        })
    })

    describe("getById", () => {
        it("retorna producto por id", async () => {
            const menu = {
                _id: "menu1",
                name: "Menu 1",
                products: [{ product_id: "p1", name: "Burger" }]
            }
            mockCollection.findOne.mockResolvedValue(menu)

            const dao = new ProductMongoDAO()
            const result = await dao.getById("p1")

            expect(result).toEqual(expect.objectContaining({
                product_id: "p1",
                menu_id: "menu1",
                menu_name: "Menu 1"
            }))
        })

        it("retorna null si no encuentra", async () => {
            mockCollection.findOne.mockResolvedValue(null)

            const dao = new ProductMongoDAO()
            const result = await dao.getById("noexiste")

            expect(result).toBeNull()
        })
    })

    describe("create", () => {
        it("crea producto embebido en menu", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new ProductMongoDAO()
            const result = await dao.create({
                menuId: "507f1f77bcf86cd799439012",
                name: "New Product",
                description: "Desc",
                price: 9.99,
                isAvailable: true
            })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                {
                    $push: {
                        products: expect.objectContaining({
                            product_id: expect.any(String),
                            name: "New Product",
                            price: 9.99,
                            is_available: true
                        })
                    },
                    $set: { updated_at: expect.any(Date) }
                }
            )
            expect(result).toEqual(expect.objectContaining({
                name: "New Product",
                menu_id: "507f1f77bcf86cd799439012"
            }))
        })

        it("usa is_available true por defecto", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new ProductMongoDAO()
            await dao.create({ menuId: "507f1f77bcf86cd799439012", name: "Product", price: 5 })

            expect(mockCollection.updateOne).toHaveBeenLastCalledWith(
                { _id: expect.any(Object) },
                {
                    $push: {
                        products: expect.objectContaining({
                            product_id: expect.any(String),
                            name: "Product",
                            price: 5,
                            is_available: true  // ← true, no false
                        })
                    },
                    $set: { updated_at: expect.any(Date) }
                }
            )
        })
    })

    describe("update", () => {
        it("actualiza campos del producto", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })
            const updated = { product_id: "p1", name: "Updated" }
            mockCollection.findOne.mockResolvedValue({
                _id: "menu1",
                products: [updated]
            })

            const dao = new ProductMongoDAO()
            const result = await dao.update("p1", { name: "Updated", price: 10 })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "products.product_id": "p1" },
                {
                    $set: expect.objectContaining({
                        "products.$.name": "Updated",
                        "products.$.price": 10,
                        "products.$.updated_at": expect.any(Date),
                        updated_at: expect.any(Date)
                    })
                }
            )
            expect(result).toEqual(expect.objectContaining({ name: "Updated" }))
        })

        it("actualiza description", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })
            const updated = { product_id: "p1", description: "Nueva desc" }
            mockCollection.findOne.mockResolvedValue({
                _id: "menu1",
                products: [updated]
            })

            const dao = new ProductMongoDAO()
            const result = await dao.update("p1", { description: "Nueva desc" })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "products.product_id": "p1" },
                {
                    $set: expect.objectContaining({
                        "products.$.description": "Nueva desc",
                        "products.$.updated_at": expect.any(Date),
                        updated_at: expect.any(Date)
                    })
                }
            )
            expect(result).toEqual(expect.objectContaining({ description: "Nueva desc" }))
        })

        it("actualiza isAvailable", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })
            const updated = { product_id: "p1", is_available: true }
            mockCollection.findOne.mockResolvedValue({
                _id: "menu1",
                products: [updated]
            })

            const dao = new ProductMongoDAO()
            const result = await dao.update("p1", { isAvailable: true })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "products.product_id": "p1" },
                {
                    $set: expect.objectContaining({
                        "products.$.is_available": true,
                        "products.$.updated_at": expect.any(Date),
                        updated_at: expect.any(Date)
                    })
                }
            )
            expect(result).toEqual(expect.objectContaining({ is_available: true }))
        })

        it("lanza error si no hay campos para actualizar", async () => {
            const dao = new ProductMongoDAO()

            await expect(dao.update("p1", {})).rejects.toThrow("No fields to update")
        })
    })

    describe("delete", () => {
        it("elimina producto del array", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new ProductMongoDAO()
            await dao.delete("p1")

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "products.product_id": "p1" },
                {
                    $pull: { products: { product_id: "p1" } },
                    $set: { updated_at: expect.any(Date) }
                }
            )
        })
    })
})