const { NotFoundError, BadRequestError } = require("../../../src/errors")

describe("OrderService", () => {

    let orderService
    let orderDAO

    beforeEach(() => {
        jest.resetModules()

        orderDAO = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/dao/DAOFactory", () => ({
            getOrderDAO: () => orderDAO
        }))

        orderService = require("../../../src/services/orderService")
    })

    describe("getAll", () => {
        it("retorna todas las órdenes", async () => {
            orderDAO.getAll.mockResolvedValue([{ id: 1 }])

            const result = await orderService.getAll()

            expect(result).toEqual([{ id: 1 }])
            expect(orderDAO.getAll).toHaveBeenCalled()
        })
    })

    describe("getById", () => {
        it("retorna orden si existe", async () => {
            orderDAO.getById.mockResolvedValue({ id: 1 })

            const result = await orderService.getById(1)

            expect(result).toEqual({ id: 1 })
        })

        it("lanza NotFoundError si no existe", async () => {
            orderDAO.getById.mockResolvedValue(null)

            await expect(orderService.getById(1))
                .rejects
                .toThrow("Order not found")
        })
    })

    describe("create", () => {
        it("crea orden válida", async () => {
            const data = { items: [{ productId: 1 }] }

            orderDAO.create.mockResolvedValue(data)

            const result = await orderService.create(data)

            expect(result).toEqual(data)
            expect(orderDAO.create).toHaveBeenCalledWith(data)
        })

        it("lanza error si no hay items", async () => {
            await expect(orderService.create({ items: [] }))
                .rejects
                .toThrow("Order must have at least one item")
        })

        it("lanza error si items no existe", async () => {
            await expect(orderService.create({}))
                .rejects
                .toThrow("Order must have at least one item")
        })
    })

    describe("update", () => {
        it("actualiza si existe", async () => {
            orderDAO.getById.mockResolvedValue({ id: 1 })
            orderDAO.update.mockResolvedValue({ id: 1, updated: true })

            const result = await orderService.update(1, { foo: "bar" })

            expect(orderDAO.update).toHaveBeenCalledWith(1, { foo: "bar" })
            expect(result).toEqual({ id: 1, updated: true })
        })

        it("lanza error si no existe", async () => {
            orderDAO.getById.mockResolvedValue(null)

            await expect(orderService.update(1, {}))
                .rejects
                .toThrow("Order not found")
        })
    })

    describe("delete", () => {
        it("elimina si existe", async () => {
            orderDAO.getById.mockResolvedValue({ id: 1 })
            orderDAO.delete.mockResolvedValue()

            await orderService.delete(1)

            expect(orderDAO.delete).toHaveBeenCalledWith(1)
        })

        it("lanza error si no existe", async () => {
            orderDAO.getById.mockResolvedValue(null)

            await expect(orderService.delete(1))
                .rejects
                .toThrow("Order not found")
        })
    })

})