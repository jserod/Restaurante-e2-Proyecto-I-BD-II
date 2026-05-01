// tests/integration/menusRoutes.test.js
const request = require("supertest")
const express = require("express")

describe("Menus Routes", () => {
    let app
    let mockMenuService

    beforeEach(() => {
        jest.resetModules()

        mockMenuService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            getByRestaurant: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        // Mock del service ANTES de cargar el controller
        jest.doMock("../../src/services/menuService", () => mockMenuService)

        // Mock de middlewares de auth
        jest.doMock("../../src/middlewares/keycloakProtect", () => {
            return () => (req, res, next) => next()
        })
        
        jest.doMock("../../src/middlewares/requireRole", () => {
            return () => (req, res, next) => next()
        })

        // Mock de cache
        jest.doMock("../../src/middlewares/cache", () => ({
            cache: () => (req, res, next) => next(),
            invalidateCache: jest.fn(),
            invalidateOnSuccess: () => (req, res, next) => next()
        }))

        const menusRoutes = require("../../src/routes/menusRoutes")
        
        app = express()
        app.use(express.json())
        app.use("/menus", menusRoutes)
        
        // Error handler
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message })
        })
    })

    describe("GET /menus", () => {
        it("retorna todos los menus", async () => {
            const menus = [{ _id: "1", name: "Menu 1" }]
            mockMenuService.getAll.mockResolvedValue(menus)

            const res = await request(app).get("/menus")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(menus)
            expect(mockMenuService.getAll).toHaveBeenCalled()
        })
    })

    describe("GET /menus/:id", () => {
        it("retorna menu por id", async () => {
            const menu = { _id: "1", name: "Menu 1" }
            mockMenuService.getById.mockResolvedValue(menu)

            const res = await request(app).get("/menus/1")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(menu)
            expect(mockMenuService.getById).toHaveBeenCalledWith("1")
        })
    })

    describe("POST /menus", () => {
        it("crea menu con datos validos", async () => {
            const created = { _id: "1", name: "Nuevo Menu" }
            mockMenuService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/menus")
                .send({ restaurantId: "10", name: "Nuevo Menu", description: "Desc" })

            expect(res.status).toBe(201)
            expect(res.body).toEqual(created)
            expect(mockMenuService.create).toHaveBeenCalledWith({
                restaurantId: "10",
                name: "Nuevo Menu",
                description: "Desc"
            })
        })

        it("retorna 400 si faltan campos requeridos", async () => {
            const res = await request(app)
                .post("/menus")
                .send({ restaurantId: "10" })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("restaurantId and name are required")
        })
    })

    describe("PUT /menus/:id", () => {
        it("actualiza menu", async () => {
            const updated = { _id: "1", name: "Updated" }
            mockMenuService.update.mockResolvedValue(updated)

            const res = await request(app)
                .put("/menus/1")
                .send({ name: "Updated" })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(updated)
            expect(mockMenuService.update).toHaveBeenCalledWith("1", { name: "Updated" })
        })
    })

    describe("DELETE /menus/:id", () => {
        it("elimina menu", async () => {
            mockMenuService.delete.mockResolvedValue()

            const res = await request(app).delete("/menus/1")

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("Menu deleted")
            expect(mockMenuService.delete).toHaveBeenCalledWith("1")
        })
    })
})