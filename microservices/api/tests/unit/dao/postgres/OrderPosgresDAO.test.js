const { createMockPool } = require("../../../helpers/mockPool")

describe("OrderPostgresDAO", () => {
    let OrderPostgresDAO
    let mockPool
    let mockClient

    beforeEach(() => {
        jest.resetModules()

        const mocks = createMockPool()
        mockPool = mocks.mockPool
        mockClient = mocks.mockClient

        jest.doMock("../../../../src/config/database", () => mockPool)
        OrderPostgresDAO = require("../../../../src/dao/postgres/OrderPostgresDAO")
    })

    describe("getById", () => {
        it("retorna orden con items", async () => {
            const order = {
                id: 1,
                user_id: 5,
                items: [{ product_id: 1, name: "Burger", quantity: 2, unit_price: 9.99 }]
            }
            mockPool.query.mockResolvedValue({ rows: [order] })

            const dao = new OrderPostgresDAO()
            const result = await dao.getById(1)

            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT o.*"), [1])
            expect(result).toEqual(order)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new OrderPostgresDAO()
            const result = await dao.getById(999)

            expect(result).toBeUndefined()
        })
    })

    describe("getAll", () => {
        it("retorna todas las ordenes con items", async () => {
            const orders = [{ id: 1 }, { id: 2 }]
            mockPool.query.mockResolvedValue({ rows: orders })

            const dao = new OrderPostgresDAO()
            const result = await dao.getAll()

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("GROUP BY o.id")
            )
            expect(result).toEqual(orders)
        })
    })

    describe("create", () => {
        const items = [{ productId: 1, quantity: 2 }]

        beforeEach(() => {
            mockClient.query.mockImplementation((sql) => {
                if (sql === "BEGIN") return Promise.resolve()
                if (sql === "COMMIT") return Promise.resolve()
                if (sql === "ROLLBACK") return Promise.resolve()
                if (sql.includes("SELECT price FROM products")) {
                    return Promise.resolve({ rows: [{ price: 9.99 }] })
                }
                if (sql.includes("INSERT INTO orders")) {
                    return Promise.resolve({ rows: [{ id: 1, user_id: 5, total: 19.98 }] })
                }
                if (sql.includes("INSERT INTO order_items")) {
                    return Promise.resolve({ rows: [] })
                }
                return Promise.resolve({ rows: [] })
            })
        })

        it("crea orden con transacción", async () => {
            const dao = new OrderPostgresDAO()
            const result = await dao.create({
                userId: 5,
                restaurantId: 10,
                reservationId: 20,
                pickup: true,
                items
            })

            expect(mockPool.connect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledWith("BEGIN")
            expect(mockClient.query).toHaveBeenCalledWith("COMMIT")
            expect(mockClient.release).toHaveBeenCalled()
            expect(result).toEqual(expect.objectContaining({ id: 1, total: 19.98 }))
        })

        it("usa valores por defecto para reservationId y pickup", async () => {
            const dao = new OrderPostgresDAO()
            await dao.create({ userId: 5, restaurantId: 10, items })

            const insertCall = mockClient.query.mock.calls.find(c => c[0].includes("INSERT INTO orders"))
            expect(insertCall[1]).toEqual([5, 10, null, false, expect.any(Number)])
        })

        it("hace rollback si producto no existe", async () => {
            mockClient.query.mockImplementation((sql) => {
                if (sql === "BEGIN") return Promise.resolve()
                if (sql === "ROLLBACK") return Promise.resolve()
                if (sql.includes("SELECT price FROM products")) {
                    return Promise.resolve({ rows: [] })
                }
                return Promise.resolve({ rows: [] })
            })

            const dao = new OrderPostgresDAO()

            await expect(dao.create({ userId: 5, restaurantId: 10, items })).rejects.toThrow("Product 1 not found")
            expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK")
            expect(mockClient.release).toHaveBeenCalled()
        })

        it("hace rollback si falla insert de order_items", async () => {
            mockClient.query.mockImplementation((sql) => {
                if (sql === "BEGIN") return Promise.resolve()
                if (sql === "ROLLBACK") return Promise.resolve()
                if (sql.includes("SELECT price")) return Promise.resolve({ rows: [{ price: 9.99 }] })
                if (sql.includes("INSERT INTO orders")) return Promise.resolve({ rows: [{ id: 1 }] })
                if (sql.includes("INSERT INTO order_items")) return Promise.reject(new Error("FK violation"))
                return Promise.resolve({ rows: [] })
            })

            const dao = new OrderPostgresDAO()

            await expect(dao.create({ userId: 5, restaurantId: 10, items })).rejects.toThrow("FK violation")
            expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK")
            expect(mockClient.release).toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("actualiza status", async () => {
            const updated = { id: 1, status: "completed" }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new OrderPostgresDAO()
            const result = await dao.update(1, { status: "completed" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE orders"),
                ["completed", 1]
            )
            expect(result).toEqual(updated)
        })
    })

    describe("delete", () => {
        it("elimina orden", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new OrderPostgresDAO()
            await dao.delete(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                "DELETE FROM orders WHERE id = $1",
                [1]
            )
        })
    })
})