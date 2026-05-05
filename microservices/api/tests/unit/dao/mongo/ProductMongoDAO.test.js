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
        it("retorna productos de todos los restaurantes y menus", async () => {
            const restaurants = [
                {
                    _id: "r1",
                    name: "Resto 1",
                    menus: [
                        {
                            _id: "m1",
                            name: "Desayunos",
                            products: [
                                { product_id: "p1", name: "Cafe" },
                                { product_id: "p2", name: "Pan" }
                            ]
                        }
                    ]
                },
                {
                    _id: "r2",
                    name: "Resto 2",
                    menus: [
                        {
                            _id: "m2",
                            name: "Almuerzos",
                            products: [{ product_id: "p3", name: "Casado" }]
                        }
                    ]
                }
            ]
            mockCollection.toArray.mockResolvedValue(restaurants)

            const dao = new ProductMongoDAO()
            const result = await dao.getAll()

            expect(mockDb.collection).toHaveBeenCalledWith("restaurants")
            expect(result).toHaveLength(3)
            expect(result[0]).toEqual(expect.objectContaining({
                product_id: "p1",
                menu_id: "m1",
                menu_name: "Desayunos",
                restaurant_id: "r1"
            }))
        })

        it("retorna array vacio si no hay productos", async () => {
            mockCollection.toArray.mockResolvedValue([
                { _id: "r1", name: "Resto", menus: [{ _id: "m1", name: "Menu" }] }
            ])

            const dao = new ProductMongoDAO()
            const result = await dao.getAll()

            expect(result).toEqual([])
        })

        it("ignora restaurantes sin menus", async () => {
            mockCollection.toArray.mockResolvedValue([
                { _id: "r1", name: "Resto sin menus" }
            ])

            const dao = new ProductMongoDAO()
            const result = await dao.getAll()

            expect(result).toEqual([])
        })
    })

    describe("getById", () => {
        it("retorna producto por id", async () => {
            const restaurant = {
                _id: "r1",
                name: "Resto 1",
                menus: [{
                    _id: "m1",
                    name: "Desayunos",
                    products: [{ product_id: "p1", name: "Cafe" }]
                }]
            }
            mockCollection.findOne.mockResolvedValue(restaurant)

            const dao = new ProductMongoDAO()
            const result = await dao.getById("p1")

            expect(result).toEqual(expect.objectContaining({
                product_id: "p1",
                menu_id: "m1",
                restaurant_id: "r1"
            }))
        })

        it("retorna null si restaurante no existe", async () => {
            mockCollection.findOne.mockResolvedValue(null)

            const dao = new ProductMongoDAO()
            const result = await dao.getById("noexiste")

            expect(result).toBeNull()
        })

        it("retorna null si el producto no esta en el menu", async () => {
            mockCollection.findOne.mockResolvedValue({
                _id: "r1",
                menus: [{ _id: "m1", name: "Menu", products: [] }]
            })

            const dao = new ProductMongoDAO()
            const result = await dao.getById("noexiste")

            expect(result).toBeNull()
        })
    })

    describe("create", () => {
        it("crea producto embebido en menu del restaurante", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new ProductMongoDAO()
            const result = await dao.create({
                menuId: "507f1f77bcf86cd799439012",
                name: "Gallo Pinto",
                description: "Con natilla",
                price: 3500,
                isAvailable: true
            })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "menus._id": expect.any(Object) },
                {
                    $push: { "menus.$.products": expect.objectContaining({
                        product_id: expect.any(String),
                        name: "Gallo Pinto",
                        description: "Con natilla",
                        price: 3500,
                        is_available: true
                    })},
                    $set: { updated_at: expect.any(Date) }
                }
            )
            expect(result).toEqual(expect.objectContaining({
                name: "Gallo Pinto",
                menu_id: "507f1f77bcf86cd799439012"
            }))
        })

        it("usa is_available true por defecto", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new ProductMongoDAO()
            await dao.create({
                menuId: "507f1f77bcf86cd799439012",
                name: "Cafe",
                price: 1000
            })

            const call = mockCollection.updateOne.mock.calls[0]
            expect(call[1].$push["menus.$.products"].is_available).toBe(true)
        })
    })

    describe("update", () => {
        it("actualiza name y price", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })
            mockCollection.findOne.mockResolvedValue({
                _id: "r1",
                menus: [{ _id: "m1", products: [{ product_id: "p1", name: "Updated" }] }]
            })

            const dao = new ProductMongoDAO()
            const result = await dao.update("p1", { name: "Updated", price: 5000 })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "menus.products.product_id": "p1" },
                { $set: expect.objectContaining({
                    "menus.$[menu].products.$[product].name": "Updated",
                    "menus.$[menu].products.$[product].price": 5000
                })},
                expect.objectContaining({ arrayFilters: expect.any(Array) })
            )
            expect(result).toEqual(expect.objectContaining({ product_id: "p1" }))
        })

        it("actualiza description", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })
            mockCollection.findOne.mockResolvedValue({
                _id: "r1",
                menus: [{ _id: "m1", products: [{ product_id: "p1", description: "Nueva" }] }]
            })

            const dao = new ProductMongoDAO()
            await dao.update("p1", { description: "Nueva" })

            const call = mockCollection.updateOne.mock.calls[0]
            
            expect(call[1].$set["menus.$[menu].products.$[product].description"]).toBe("Nueva")
        })

        it("actualiza isAvailable", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })
            mockCollection.findOne.mockResolvedValue({
                _id: "r1",
                menus: [{ _id: "m1", products: [{ product_id: "p1", is_available: false }] }]
            })

            const dao = new ProductMongoDAO()
            await dao.update("p1", { isAvailable: false })

            const call = mockCollection.updateOne.mock.calls[0]
            
            expect(call[1].$set["menus.$[menu].products.$[product].is_available"]).toBe(false)
        })

        it("lanza error si no hay campos para actualizar", async () => {
            const dao = new ProductMongoDAO()

            await expect(dao.update("p1", {})).rejects.toThrow("No fields to update")
        })
    })

    describe("delete", () => {
        it("elimina producto del array del menu", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new ProductMongoDAO()
            await dao.delete("p1")

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "menus.products.product_id": "p1" },
                {
                    $pull: { "menus.$[menu].products": { product_id: "p1" } },
                    $set: { updated_at: expect.any(Date) }
                },
                expect.objectContaining({ arrayFilters: expect.any(Array) })
            )
        })
    })
})