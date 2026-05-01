// tests/unit/controllers/restaurantsController.test.js
const { createMockReq, createMockRes, createMockNext } = require("../../helpers/mockExpress")

describe("restaurantsController", () => {
    let restaurantsController
    let restaurantService

    beforeEach(() => {
        jest.resetModules()

        restaurantService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/services/restaurantService", () => restaurantService)
        restaurantsController = require("../../../src/controllers/restaurantsController")
    })

    describe("getRestaurants", () => {
        it("retorna todos los restaurantes", async () => {
            const restaurants = [{ id: 1, name: "Rest 1" }]
            restaurantService.getAll.mockResolvedValue(restaurants)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.getRestaurants(req, res, next)

            expect(restaurantService.getAll).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(restaurants)
        })

        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            restaurantService.getAll.mockRejectedValue(error)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.getRestaurants(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getRestaurantById", () => {
        it("retorna restaurante por id", async () => {
            const restaurant = { id: 1, name: "Rest 1" }
            restaurantService.getById.mockResolvedValue(restaurant)

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.getRestaurantById(req, res, next)

            expect(restaurantService.getById).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith(restaurant)
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            restaurantService.getById.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.getRestaurantById(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("createRestaurant", () => {
        it("crea restaurante con nombre", async () => {
            const created = { id: 1, name: "Nuevo" }
            restaurantService.create.mockResolvedValue(created)

            const req = createMockReq({ body: { name: "Nuevo", address: "Calle 1" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.createRestaurant(req, res, next)

            expect(restaurantService.create).toHaveBeenCalledWith({ name: "Nuevo", address: "Calle 1" })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith(created)
        })

        it("lanza BadRequestError si falta nombre", async () => {
            const req = createMockReq({ body: { address: "Calle 1" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.createRestaurant(req, res, next)

            expect(next.mock.calls[0][0].message).toBe("Name is required")
        })

        it("pasa errores del service a next", async () => {
            const error = new Error("DB fail")
            restaurantService.create.mockRejectedValue(error)

            const req = createMockReq({ body: { name: "Nuevo" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.createRestaurant(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("updateRestaurant", () => {
        it("actualiza restaurante", async () => {
            const updated = { id: 1, name: "Updated" }
            restaurantService.update.mockResolvedValue(updated)

            const req = createMockReq({ params: { id: "1" }, body: { name: "Updated" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.updateRestaurant(req, res, next)

            expect(restaurantService.update).toHaveBeenCalledWith("1", { name: "Updated" })
            expect(res.json).toHaveBeenCalledWith(updated)
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            restaurantService.update.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" }, body: { name: "Updated" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.updateRestaurant(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("deleteRestaurant", () => {
        it("elimina restaurante", async () => {
            restaurantService.delete.mockResolvedValue()

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.deleteRestaurant(req, res, next)

            expect(restaurantService.delete).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant deleted" })
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            restaurantService.delete.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await restaurantsController.deleteRestaurant(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})