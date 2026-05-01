// tests/unit/dao/postgres/MenuPostgresDAO.test.js
const { createMockPool } = require("../../../helpers/mockPool")

describe("MenuPostgresDAO", () => {
    let MenuPostgresDAO
    let mockPool
    let mockClient

    beforeEach(() => {
        jest.resetModules()

        const mocks = createMockPool()
        mockPool = mocks.mockPool
        mockClient = mocks.mockClient

        jest.doMock("../../../../src/config/database", () => mockPool)
        MenuPostgresDAO = require("../../../../src/dao/postgres/MenuPostgresDAO")
    })

    describe("getAll", () => {
        it("retorna todos los menus", async () => {
            const menus = [
                { id: 1, restaurant_id: 10, name: "Menu 1", description: "Desc 1", created_at: "2024-01-01" },
                { id: 2, restaurant_id: 20, name: "Menu 2", description: null, created_at: "2024-01-02" }
            ]
            mockPool.query.mockResolvedValue({ rows: menus })

            const dao = new MenuPostgresDAO()
            const result = await dao.getAll()

            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT"))
            expect(result).toEqual(menus)
        })
    })

    describe("getById", () => {
        it("retorna menu por id", async () => {
            const menu = { id: 1, restaurant_id: 10, name: "Menu 1", description: "Desc", created_at: "2024-01-01" }
            mockPool.query.mockResolvedValue({ rows: [menu] })

            const dao = new MenuPostgresDAO()
            const result = await dao.getById(1)

            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE id = $1"), [1])
            expect(result).toEqual(menu)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new MenuPostgresDAO()
            const result = await dao.getById(999)

            expect(result).toBeUndefined()
        })
    })

    describe("getByRestaurant", () => {
        it("retorna menus por restaurante", async () => {
            const menus = [{ id: 1, restaurant_id: 10, name: "Menu 1" }]
            mockPool.query.mockResolvedValue({ rows: menus })

            const dao = new MenuPostgresDAO()
            const result = await dao.getByRestaurant(10)

            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE restaurant_id = $1"), [10])
            expect(result).toEqual(menus)
        })
    })

    describe("create", () => {
        it("crea menu con description", async () => {
            const created = { id: 1, restaurant_id: 10, name: "Menu", description: "Desc", created_at: "2024-01-01" }
            mockPool.query.mockResolvedValue({ rows: [created] })

            const dao = new MenuPostgresDAO()
            const result = await dao.create({ restaurantId: 10, name: "Menu", description: "Desc" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO menus"),
                [10, "Menu", "Desc"]
            )
            expect(result).toEqual(created)
        })

        it("crea menu sin description (null)", async () => {
            const created = { id: 1, restaurant_id: 10, name: "Menu", description: null, created_at: "2024-01-01" }
            mockPool.query.mockResolvedValue({ rows: [created] })

            const dao = new MenuPostgresDAO()
            const result = await dao.create({ restaurantId: 10, name: "Menu" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.any(String),
                [10, "Menu", null]
            )
            expect(result).toEqual(created)
        })
    })

    describe("update", () => {
        it("actualiza name y description", async () => {
            const updated = { id: 1, restaurant_id: 10, name: "Updated", description: "New desc", created_at: "2024-01-01" }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new MenuPostgresDAO()
            const result = await dao.update(1, { name: "Updated", description: "New desc" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE menus"),
                ["Updated", "New desc", 1]
            )
            expect(result).toEqual(updated)
        })

        it("actualiza solo name", async () => {
            const updated = { id: 1, name: "Updated" }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new MenuPostgresDAO()
            const result = await dao.update(1, { name: "Updated" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("name = $1"),
                ["Updated", 1]
            )
            expect(result).toEqual(updated)
        })

        it("actualiza solo description", async () => {
            const updated = { id: 1, description: "New" }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new MenuPostgresDAO()
            const result = await dao.update(1, { description: "New" })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("description = $1"),
                ["New", 1]
            )
        })

        it("lanza error si no hay campos para actualizar", async () => {
            const dao = new MenuPostgresDAO()

            await expect(dao.update(1, {})).rejects.toThrow("No fields to update")
            expect(mockPool.query).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        it("elimina menu", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new MenuPostgresDAO()
            await dao.delete(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                "DELETE FROM menus WHERE id = $1",
                [1]
            )
        })
    })
})