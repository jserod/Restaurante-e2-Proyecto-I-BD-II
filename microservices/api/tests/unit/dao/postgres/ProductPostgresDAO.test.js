const { createMockPool } = require("../../../helpers/mockPool")

describe("ProductPostgresDAO", () => {
    let ProductPostgresDAO
    let mockPool

    beforeEach(() => {
        jest.resetModules()

        const mocks = createMockPool()
        mockPool = mocks.mockPool

        jest.doMock("../../../../src/config/database", () => mockPool)
        ProductPostgresDAO = require("../../../../src/dao/postgres/ProductPostgresDAO")
    })

    describe("getAll", () => {
        it("retorna todos los productos con JOIN a menus", async () => {
            const products = [
                { id: 1, name: "Burger", menu_id: 1, menu_name: "Almuerzo", restaurant_id: 1 }
            ]
            mockPool.query.mockResolvedValue({ rows: products })

            const dao = new ProductPostgresDAO()
            const result = await dao.getAll()

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("JOIN menus m ON m.id = p.menu_id")
            )
            expect(result).toEqual(products)
        })
    })

    describe("getById", () => {
        it("retorna producto por id", async () => {
            const product = { id: 1, name: "Burger", menu_id: 1 }
            mockPool.query.mockResolvedValue({ rows: [product] })

            const dao = new ProductPostgresDAO()
            const result = await dao.getById(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("WHERE p.id = $1"),
                [1]
            )
            expect(result).toEqual(product)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new ProductPostgresDAO()
            const result = await dao.getById(999)

            expect(result).toBeUndefined()
        })
    })

    describe("create", () => {
        it("inserta producto con todos los campos", async () => {
            const product = { id: 1, menu_id: 2, name: "Pizza", description: "Italiana", price: 12.99, is_available: true }
            mockPool.query.mockResolvedValue({ rows: [product] })

            const dao = new ProductPostgresDAO()
            const result = await dao.create({
                menuId: 2,
                name: "Pizza",
                description: "Italiana",
                price: 12.99,
                isAvailable: true
            })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO products"),
                [2, "Pizza", "Italiana", 12.99, true]
            )
            expect(result).toEqual(product)
        })

        it("usa null para description si no se provee", async () => {
            const product = { id: 1, menu_id: 2, name: "Pizza", description: null, price: 12.99, is_available: true }
            mockPool.query.mockResolvedValue({ rows: [product] })

            const dao = new ProductPostgresDAO()
            await dao.create({ menuId: 2, name: "Pizza", price: 12.99 })

            const call = mockPool.query.mock.calls[0]
            expect(call[1][2]).toBeNull()
        })

        it("usa true para isAvailable por defecto", async () => {
            mockPool.query.mockResolvedValue({ rows: [{}] })

            const dao = new ProductPostgresDAO()
            await dao.create({ menuId: 2, name: "Pizza", price: 12.99 })

            const call = mockPool.query.mock.calls[0]
            expect(call[1][4]).toBe(true)
        })

        it("respeta isAvailable false", async () => {
            mockPool.query.mockResolvedValue({ rows: [{}] })

            const dao = new ProductPostgresDAO()
            await dao.create({ menuId: 2, name: "Pizza", price: 12.99, isAvailable: false })

            const call = mockPool.query.mock.calls[0]
            expect(call[1][4]).toBe(false)
        })
    })

    describe("update", () => {
        it("actualiza campos provistos", async () => {
            const updated = { id: 1, name: "Burger Updated" }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new ProductPostgresDAO()
            const result = await dao.update(1, { name: "Burger Updated" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE products"),
                ["Burger Updated", 1]
            )
            expect(result).toEqual(updated)
        })

        it("actualiza múltiples campos", async () => {
            mockPool.query.mockResolvedValue({ rows: [{}] })

            const dao = new ProductPostgresDAO()
            await dao.update(1, { name: "Nueva", price: 9.99, isAvailable: false })

            const call = mockPool.query.mock.calls[0]
            expect(call[1]).toEqual(["Nueva", 9.99, false, 1])
        })

        it("lanza error si no hay campos para actualizar", async () => {
            const dao = new ProductPostgresDAO()

            await expect(dao.update(1, {})).rejects.toThrow("No fields to update")
        })

        it("actualiza menuId", async () => {
            mockPool.query.mockResolvedValue({ rows: [{}] })

            const dao = new ProductPostgresDAO()
            await dao.update(1, { menuId: 5 })

            const call = mockPool.query.mock.calls[0]
            expect(call[0]).toContain("menu_id")
            expect(call[1]).toEqual([5, 1])
        })

        it("actualiza description", async () => {
            mockPool.query.mockResolvedValue({ rows: [{}] })

            const dao = new ProductPostgresDAO()
            await dao.update(1, { description: "Nueva descripción" })

            const call = mockPool.query.mock.calls[0]
            expect(call[0]).toContain("description")
            expect(call[1]).toEqual(["Nueva descripción", 1])
        })
    })

    describe("delete", () => {
        it("elimina producto por id", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new ProductPostgresDAO()
            await dao.delete(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                "DELETE FROM products WHERE id = $1",
                [1]
            )
        })
    })
})