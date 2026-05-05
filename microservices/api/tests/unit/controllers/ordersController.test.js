const { createMockReq, createMockRes, createMockNext } = require("../../helpers/mockExpress")

describe("ordersController", () => {
    let ordersController
    let orderService

    beforeEach(() => {
        jest.resetModules()

        orderService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/services/orderService", () => orderService)
        ordersController = require("../../../src/controllers/ordersController")
    })

    describe("createOrder", () => {
        it("crea orden con datos válidos", async () => {
            const created = { id: 1, userId: 5, restaurantId: 10, items: [{ productId: 1 }] }
            orderService.create.mockResolvedValue(created)

            const req = createMockReq({
                user: { id: 5 },
                body: {
                    restaurantId: 10,
                    reservationId: 20,
                    pickup: true,
                    items: [{ productId: 1, quantity: 2 }]
                }
            })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.createOrder(req, res, next)

            expect(orderService.create).toHaveBeenCalledWith({
                userId: 5,
                restaurantId: 10,
                reservationId: 20,
                pickup: true,
                items: [{ productId: 1, quantity: 2 }]
            })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith(created)
        })

        it("crea orden sin reservationId ni pickup", async () => {
            const created = { id: 1, userId: 5, restaurantId: 10, items: [{ productId: 1 }] }
            orderService.create.mockResolvedValue(created)

            const req = createMockReq({
                user: { id: 5 },
                body: { restaurantId: 10, items: [{ productId: 1 }] }
            })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.createOrder(req, res, next)

            expect(orderService.create).toHaveBeenCalledWith({
                userId: 5,
                restaurantId: 10,
                reservationId: undefined,
                pickup: undefined,
                items: [{ productId: 1 }]
            })
        })

        it("lanza BadRequestError si no hay items", async () => {
            const req = createMockReq({
                user: { id: 5 },
                body: { restaurantId: 10, items: [] }
            })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.createOrder(req, res, next)

            expect(next.mock.calls[0][0].message).toBe("Order must have at least one item")
        })

        it("lanza BadRequestError si items no existe", async () => {
            const req = createMockReq({
                user: { id: 5 },
                body: { restaurantId: 10 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.createOrder(req, res, next)

            expect(next.mock.calls[0][0].message).toBe("Order must have at least one item")
        })

        it("pasa errores del service a next", async () => {
            const error = new Error("DB fail")
            orderService.create.mockRejectedValue(error)

            const req = createMockReq({
                user: { id: 5 },
                body: { restaurantId: 10, items: [{ productId: 1 }] }
            })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.createOrder(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getOrderById", () => {
        it("retorna orden por id", async () => {
            const order = { id: 1, items: [{ productId: 1 }] }
            orderService.getById.mockResolvedValue(order)

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.getOrderById(req, res, next)

            expect(orderService.getById).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith(order)
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            orderService.getById.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.getOrderById(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getAllOrders", () => {
        it("retorna todas las órdenes", async () => {
            const orders = [{ id: 1 }, { id: 2 }]
            orderService.getAll.mockResolvedValue(orders)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.getAllOrders(req, res, next)

            expect(orderService.getAll).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(orders)
        })

        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            orderService.getAll.mockRejectedValue(error)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.getAllOrders(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("updateOrder", () => {
        it("actualiza orden", async () => {
            const updated = { id: 1, status: "completed" }
            orderService.update.mockResolvedValue(updated)

            const req = createMockReq({
                params: { id: "1" },
                body: { status: "completed" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.updateOrder(req, res, next)

            expect(orderService.update).toHaveBeenCalledWith("1", { status: "completed" })
            expect(res.json).toHaveBeenCalledWith(updated)
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            orderService.update.mockRejectedValue(error)

            const req = createMockReq({
                params: { id: "999" },
                body: { status: "completed" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.updateOrder(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("deleteOrder", () => {
        it("elimina orden", async () => {
            orderService.delete.mockResolvedValue()

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.deleteOrder(req, res, next)

            expect(orderService.delete).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith({ message: "Order deleted" })
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            orderService.delete.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await ordersController.deleteOrder(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})