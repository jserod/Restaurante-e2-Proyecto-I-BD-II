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
        it("retorna todos los menus de todos los restaurantes", async () => {
            const restaurants = [
                { _id: "r1", name: "Resto 1", menus: [{ _id: "m1", name: "Desayunos" }] },
                { _id: "r2", name: "Resto 2", menus: [{ _id: "m2", name: "Almuerzos" }] }
            ]
            mockCollection.toArray.mockResolvedValue(restaurants)

            const dao = new MenuMongoDAO()
            const result = await dao.getAll()

            expect(mockDb.collection).toHaveBeenCalledWith("restaurants")
            expect(result).toHaveLength(2)
            expect(result[0]).toEqual(expect.objectContaining({
                name: "Desayunos",
                restaurant_id: "r1",
                restaurant_name: "Resto 1"
            }))
        })

        it("retorna array vacio si no hay menus", async () => {
            mockCollection.toArray.mockResolvedValue([
                { _id: "r1", name: "Resto 1", menus: [] }
            ])

            const dao = new MenuMongoDAO()
            const result = await dao.getAll()

            expect(result).toEqual([])
        })

        it("ignora restaurantes sin campo menus", async () => {
            mockCollection.toArray.mockResolvedValue([
                { _id: "r1", name: "Resto sin menus" }
            ])

            const dao = new MenuMongoDAO()
            const result = await dao.getAll()

            expect(result).toEqual([])
        })
    })

    describe("getById", () => {
        it("retorna menu por id", async () => {
            const restaurant = {
                _id: "r1",
                name: "Resto 1",
                menus: [{ _id: "507f1f77bcf86cd799439011", name: "Desayunos" }]
            }
            mockCollection.findOne.mockResolvedValue(restaurant)

            const dao = new MenuMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(mockCollection.findOne).toHaveBeenCalledWith(
                { "menus._id": expect.any(Object) },
                expect.any(Object)
            )
            expect(result).toEqual(expect.objectContaining({
                name: "Desayunos",
                restaurant_id: "r1"
            }))
        })

        it("retorna null si no existe", async () => {
            mockCollection.findOne.mockResolvedValue(null)

            const dao = new MenuMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(result).toBeNull()
        })

        it("retorna null si el restaurante no tiene menus", async () => {
            mockCollection.findOne.mockResolvedValue({ _id: "r1", menus: [] })

            const dao = new MenuMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(result).toBeNull()
        })
    })

    describe("getByRestaurant", () => {
        it("retorna menus de un restaurante", async () => {
            const restaurant = {
                _id: "507f1f77bcf86cd799439011",
                menus: [
                    { _id: "m1", name: "Desayunos" },
                    { _id: "m2", name: "Almuerzos" }
                ]
            }
            mockCollection.findOne.mockResolvedValue(restaurant)

            const dao = new MenuMongoDAO()
            const result = await dao.getByRestaurant("507f1f77bcf86cd799439011")

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual(expect.objectContaining({ name: "Desayunos" }))
        })

        it("retorna array vacio si restaurante no tiene menus", async () => {
            mockCollection.findOne.mockResolvedValue({ _id: "r1" })

            const dao = new MenuMongoDAO()
            const result = await dao.getByRestaurant("507f1f77bcf86cd799439011")

            expect(result).toEqual([])
        })

        it("retorna array vacio si restaurante no existe", async () => {
            mockCollection.findOne.mockResolvedValue(null)

            const dao = new MenuMongoDAO()
            const result = await dao.getByRestaurant("507f1f77bcf86cd799439011")

            expect(result).toEqual([])
        })
    })

    describe("create", () => {
        it("crea menu embebido en restaurante con description", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new MenuMongoDAO()
            const result = await dao.create({
                restaurantId: "507f1f77bcf86cd799439011",
                name: "Cenas",
                description: "Menu nocturno"
            })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                {
                    $push: { menus: expect.objectContaining({
                        _id: expect.any(Object),
                        name: "Cenas",
                        description: "Menu nocturno",
                        products: [],
                        created_at: expect.any(Date)
                    })},
                    $set: { updated_at: expect.any(Date) }
                }
            )
            expect(result).toEqual(expect.objectContaining({ name: "Cenas" }))
        })

        it("crea menu sin description (null)", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new MenuMongoDAO()
            await dao.create({ restaurantId: "507f1f77bcf86cd799439011", name: "Bebidas" })

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                expect.any(Object),
                {
                    $push: { menus: expect.objectContaining({ description: null }) },
                    $set: expect.any(Object)
                }
            )
        })
    })

    describe("update", () => {
        it("actualiza name y description", async () => {
            const updated = {
                _id: "r1",
                menus: [{ _id: "507f1f77bcf86cd799439011", name: "Updated", description: "New" }]
            }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new MenuMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", {
                name: "Updated", description: "New"
            })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { "menus._id": expect.any(Object) },
                { $set: expect.objectContaining({
                    "menus.$.name": "Updated",
                    "menus.$.description": "New"
                })},
                expect.any(Object)
            )
            expect(result).toEqual(expect.objectContaining({ name: "Updated" }))
        })

        it("actualiza solo name", async () => {
            const updated = {
                _id: "r1",
                menus: [{ _id: "507f1f77bcf86cd799439011", name: "Updated" }]
            }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new MenuMongoDAO()
            await dao.update("507f1f77bcf86cd799439011", { name: "Updated" })

            const call = mockCollection.findOneAndUpdate.mock.calls[0]

            expect(call[1].$set["menus.$.name"]).toBe("Updated")
            expect(call[1].$set["menus.$.description"]).toBeUndefined()
        })

        it("retorna null si no encuentra el menu", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue(null)

            const dao = new MenuMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", { name: "X" })

            expect(result).toBeNull()
        })
    })

    describe("delete", () => {
        it("elimina menu del restaurante", async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const dao = new MenuMongoDAO()
            await dao.delete("507f1f77bcf86cd799439011")

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { "menus._id": expect.any(Object) },
                {
                    $pull: { menus: { _id: expect.any(Object) } },
                    $set: { updated_at: expect.any(Date) }
                }
            )
        })
    })
})