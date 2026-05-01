// tests/integration/productsRoutes.test.js
const request = require("supertest")
const express = require("express")
const { NotFoundError } = require("../../src/errors")

describe("Products Routes", () => {
    let app
    let mockProductService

    beforeEach(() => {
        jest.resetModules()

        mockProductService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        // Mock del service ANTES de cargar el controller
        jest.doMock("../../src/services/productService", () => mockProductService)

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

        const productsRoutes = require("../../src/routes/productsRoutes")
        
        app = express()
        app.use(express.json())
        app.use("/products", productsRoutes)
        
        // Error handler
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message })
        })
    })

    describe("GET /products", () => {
        it("retorna todos los productos", async () => {
            const products = [{ product_id: "p1", name: "Burger" }]
            mockProductService.getAll.mockResolvedValue(products)

            const res = await request(app).get("/products")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(products)
            expect(mockProductService.getAll).toHaveBeenCalled()
        })
    })

    describe("GET /products/:id", () => {
        it("retorna producto por id", async () => {
            const product = { product_id: "p1", name: "Burger" }
            mockProductService.getById.mockResolvedValue(product)

            const res = await request(app).get("/products/p1")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(product)
            expect(mockProductService.getById).toHaveBeenCalledWith("p1")
        })

        it("retorna 404 si no existe", async () => {
            mockProductService.getById.mockRejectedValue(new NotFoundError("Product not found"))

            const res = await request(app).get("/products/noexiste")

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("Product not found")
        })
    })

    describe("POST /products", () => {
        it("crea producto con datos validos", async () => {
            const created = { product_id: "p1", name: "New Product" }
            mockProductService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/products")
                .send({
                    menuId: "507f1f77bcf86cd799439012",
                    name: "New Product",
                    description: "Desc",
                    price: 9.99,
                    isAvailable: true
                })

            expect(res.status).toBe(201)
            expect(res.body).toEqual(created)
            expect(mockProductService.create).toHaveBeenCalledWith({
                menuId: "507f1f77bcf86cd799439012",
                name: "New Product",
                description: "Desc",
                price: 9.99,
                isAvailable: true
            })
        })

        it("crea producto sin description ni isAvailable", async () => {
            const created = { product_id: "p1", name: "Basic" }
            mockProductService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/products")
                .send({
                    menuId: "507f1f77bcf86cd799439012",
                    name: "Basic",
                    price: 5
                })

            expect(res.status).toBe(201)
            expect(mockProductService.create).toHaveBeenCalledWith({
                menuId: "507f1f77bcf86cd799439012",
                name: "Basic",
                price: 5,
                description: undefined,
                isAvailable: undefined
            })
        })

        it("retorna 400 si falta menuId", async () => {
            const res = await request(app)
                .post("/products")
                .send({ name: "Product", price: 5 })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("menuId, name and price are required")
        })

        it("retorna 400 si falta name", async () => {
            const res = await request(app)
                .post("/products")
                .send({ menuId: "1", price: 5 })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("menuId, name and price are required")
        })

        it("retorna 400 si falta price", async () => {
            const res = await request(app)
                .post("/products")
                .send({ menuId: "1", name: "Product" })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("menuId, name and price are required")
        })
    })

    describe("PUT /products/:id", () => {
        it("actualiza producto", async () => {
            const updated = { product_id: "p1", name: "Updated" }
            mockProductService.update.mockResolvedValue(updated)

            const res = await request(app)
                .put("/products/p1")
                .send({ name: "Updated", price: 10 })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(updated)
            expect(mockProductService.update).toHaveBeenCalledWith("p1", { name: "Updated", price: 10 })
        })

        it("retorna 404 si no existe", async () => {
            mockProductService.update.mockRejectedValue(new NotFoundError("Product not found"))

            const res = await request(app)
                .put("/products/noexiste")
                .send({ name: "Updated" })

            expect(res.status).toBe(404)
        })
    })

    describe("DELETE /products/:id", () => {
        it("elimina producto", async () => {
            mockProductService.delete.mockResolvedValue()

            const res = await request(app).delete("/products/p1")

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("Product deleted")
            expect(mockProductService.delete).toHaveBeenCalledWith("p1")
        })

        it("retorna 404 si no existe", async () => {
            mockProductService.delete.mockRejectedValue(new NotFoundError("Product not found"))

            const res = await request(app).delete("/products/noexiste")

            expect(res.status).toBe(404)
        })
    })
})