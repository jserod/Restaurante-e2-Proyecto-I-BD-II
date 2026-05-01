// tests/integration/ordersRoutes.test.js
const request = require("supertest")
const express = require("express")
const { NotFoundError } = require("../../src/errors")

describe("Orders Routes", () => {
    let app
    let mockOrderService

    beforeEach(() => {
        jest.resetModules()

        mockOrderService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        // Mock del service ANTES de cargar el controller
        jest.doMock("../../src/services/orderService", () => mockOrderService)

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

        const ordersRoutes = require("../../src/routes/ordersRoutes")
        
        app = express()
        app.use(express.json())
        app.use("/orders", ordersRoutes)
        
        // Error handler
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message })
        })
    })

    describe("GET /orders", () => {
        it("retorna todos los pedidos", async () => {
            const orders = [{ _id: "1", status: "pending" }]
            mockOrderService.getAll.mockResolvedValue(orders)

            const res = await request(app).get("/orders")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(orders)
            expect(mockOrderService.getAll).toHaveBeenCalled()
        })
    })

    describe("GET /orders/:id", () => {
        it("retorna pedido por id", async () => {
            const order = { _id: "1", status: "pending" }
            mockOrderService.getById.mockResolvedValue(order)

            const res = await request(app).get("/orders/1")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(order)
            expect(mockOrderService.getById).toHaveBeenCalledWith("1")
        })

        it("retorna 404 si no existe", async () => {
            mockOrderService.getById.mockRejectedValue(new NotFoundError("Order not found"))

            const res = await request(app).get("/orders/999")

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("Order not found")
        })
    })

    describe("POST /orders", () => {
        it("crea pedido con datos validos", async () => {
            const created = { _id: "1", status: "pending" }
            mockOrderService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/orders")
                .send({
                    restaurantId: "10",
                    items: [
                        { menuId: "1", productId: "p1", quantity: 2 }
                    ]
                })

            expect(res.status).toBe(201)
            expect(res.body).toEqual(created)
            expect(mockOrderService.create).toHaveBeenCalledWith({
                userId: "test-user-id",
                restaurantId: "10",
                reservationId: undefined,
                pickup: undefined,
                items: [
                    { menuId: "1", productId: "p1", quantity: 2 }
                ]
            })
        })

        it("retorna 400 si no hay items", async () => {
            const res = await request(app)
                .post("/orders")
                .send({ restaurantId: "10" })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("Order must have at least one item")
        })

        it("crea pedido con pickup y reservationId", async () => {
            const created = { _id: "1", status: "pending", pickup: true }
            mockOrderService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/orders")
                .send({
                    restaurantId: "10",
                    reservationId: "res-1",
                    pickup: true,
                    items: [
                        { menuId: "1", productId: "p1", quantity: 1 }
                    ]
                })

            expect(res.status).toBe(201)
            expect(mockOrderService.create).toHaveBeenCalledWith({
                userId: "test-user-id",
                restaurantId: "10",
                reservationId: "res-1",
                pickup: true,
                items: [
                    { menuId: "1", productId: "p1", quantity: 1 }
                ]
            })
        })
    })

    describe("PUT /orders/:id", () => {
        it("actualiza estado del pedido", async () => {
            const updated = { _id: "1", status: "confirmed" }
            mockOrderService.update.mockResolvedValue(updated)

            const res = await request(app)
                .put("/orders/1")
                .send({ status: "confirmed" })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(updated)
            expect(mockOrderService.update).toHaveBeenCalledWith("1", { status: "confirmed" })
        })

        it("retorna 404 si no existe", async () => {
            mockOrderService.update.mockRejectedValue(new NotFoundError("Order not found"))

            const res = await request(app)
                .put("/orders/999")
                .send({ status: "confirmed" })

            expect(res.status).toBe(404)
        })
    })

    describe("DELETE /orders/:id", () => {
        it("elimina pedido", async () => {
            mockOrderService.delete.mockResolvedValue()

            const res = await request(app).delete("/orders/1")

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("Order deleted")
            expect(mockOrderService.delete).toHaveBeenCalledWith("1")
        })

        it("retorna 404 si no existe", async () => {
            mockOrderService.delete.mockRejectedValue(new NotFoundError("Order not found"))

            const res = await request(app).delete("/orders/999")

            expect(res.status).toBe(404)
        })
    })
})