// tests/integration/restaurantsRoutes.test.js
const request = require("supertest")
const express = require("express")
const { NotFoundError, AppError } = require("../../src/errors")

describe("Restaurants Routes", () => {
    let app
    let mockRestaurantService

    beforeEach(() => {
        jest.resetModules()

        mockRestaurantService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        // Mock del service ANTES de cargar el controller
        jest.doMock("../../src/services/restaurantService", () => mockRestaurantService)

        // Mock de middlewares de auth
        jest.doMock("../../src/middlewares/keycloakProtect", () => {
            return () => (req, res, next) => next()
        })
        
        jest.doMock("../../src/middlewares/attachUser", () => {
            return (req, res, next) => {
                req.user = { id: "test-user-id" }
                next()
            }
        })

        jest.doMock("../../src/middlewares/requireRole", () => {
            return () => (req, res, next) => next()
        })

        const restaurantsRoutes = require("../../src/routes/restaurantsRoutes")
        
        app = express()
        app.use(express.json())
        app.use("/restaurants", restaurantsRoutes)
        
        // Error handler
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message })
        })
    })

    describe("GET /restaurants", () => {
        it("retorna todos los restaurantes", async () => {
            const restaurants = [{ _id: "1", name: "Rest 1" }]
            mockRestaurantService.getAll.mockResolvedValue(restaurants)

            const res = await request(app).get("/restaurants")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(restaurants)
            expect(mockRestaurantService.getAll).toHaveBeenCalled()
        })
    })

    describe("GET /restaurants/:id", () => {
        it("retorna restaurante por id", async () => {
            const restaurant = { _id: "1", name: "Rest 1" }
            mockRestaurantService.getById.mockResolvedValue(restaurant)

            const res = await request(app).get("/restaurants/1")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(restaurant)
            expect(mockRestaurantService.getById).toHaveBeenCalledWith("1")
        })

        it("retorna 404 si no existe", async () => {
            mockRestaurantService.getById.mockRejectedValue(new NotFoundError("Restaurant not found"))

            const res = await request(app).get("/restaurants/999")

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("Restaurant not found")
        })
    })

    describe("POST /restaurants", () => {
        it("crea restaurante con datos validos", async () => {
            const created = { _id: "1", name: "Nuevo Rest" }
            mockRestaurantService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/restaurants")
                .send({
                    name: "Nuevo Rest",
                    description: "Desc",
                    address: "Calle 1"
                })

            expect(res.status).toBe(201)
            expect(res.body).toEqual(created)
            expect(mockRestaurantService.create).toHaveBeenCalledWith({
                name: "Nuevo Rest",
                description: "Desc",
                address: "Calle 1"
            })
        })

        it("retorna 400 si falta name", async () => {
            mockRestaurantService.create.mockImplementation(() => {
                throw new AppError("Name is required", 400)
            })

            const res = await request(app)
                .post("/restaurants")
                .send({ address: "Calle 1" })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("Name is required")
        })
    })

    describe("PUT /restaurants/:id", () => {
        it("actualiza restaurante", async () => {
            const updated = { _id: "1", name: "Updated" }
            mockRestaurantService.update.mockResolvedValue(updated)

            const res = await request(app)
                .put("/restaurants/1")
                .send({ name: "Updated", address: "Calle 2" })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(updated)
            expect(mockRestaurantService.update).toHaveBeenCalledWith("1", { name: "Updated", address: "Calle 2" })
        })

        it("retorna 404 si no existe", async () => {
            mockRestaurantService.update.mockRejectedValue(new NotFoundError("Restaurant not found"))

            const res = await request(app)
                .put("/restaurants/999")
                .send({ name: "Updated" })

            expect(res.status).toBe(404)
        })
    })

    describe("DELETE /restaurants/:id", () => {
        it("elimina restaurante", async () => {
            mockRestaurantService.delete.mockResolvedValue()

            const res = await request(app).delete("/restaurants/1")

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("Restaurant deleted")
            expect(mockRestaurantService.delete).toHaveBeenCalledWith("1")
        })

        it("retorna 404 si no existe", async () => {
            mockRestaurantService.delete.mockRejectedValue(new NotFoundError("Restaurant not found"))

            const res = await request(app).delete("/restaurants/999")

            expect(res.status).toBe(404)
        })
    })
})