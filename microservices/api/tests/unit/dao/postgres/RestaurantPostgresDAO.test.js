const { createMockPool } = require("../../../helpers/mockPool")

describe("RestaurantPostgresDAO", () => {
    let RestaurantPostgresDAO
    let mockPool

    beforeEach(() => {
        jest.resetModules()

        const mocks = createMockPool()
        mockPool = mocks.mockPool

        jest.doMock("../../../../src/config/database", () => mockPool)
        RestaurantPostgresDAO = require("../../../../src/dao/postgres/RestaurantPostgresDAO")
    })

    describe("getAll", () => {
        it("retorna todos los restaurantes ordenados por id", async () => {
            const restaurants = [
                { id: 1, name: "La Trattoria" },
                { id: 2, name: "Sushi Bar" }
            ]
            mockPool.query.mockResolvedValue({ rows: restaurants })

            const dao = new RestaurantPostgresDAO()
            const result = await dao.getAll()

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM restaurants ORDER BY id"
            )
            expect(result).toEqual(restaurants)
        })
    })

    describe("getById", () => {
        it("retorna restaurante por id", async () => {
            const restaurant = { id: 1, name: "La Trattoria" }
            mockPool.query.mockResolvedValue({ rows: [restaurant] })

            const dao = new RestaurantPostgresDAO()
            const result = await dao.getById(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM restaurants WHERE id = $1",
                [1]
            )
            expect(result).toEqual(restaurant)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new RestaurantPostgresDAO()
            const result = await dao.getById(999)

            expect(result).toBeUndefined()
        })
    })

    describe("create", () => {
        it("inserta restaurante correctamente", async () => {
            const restaurant = { id: 1, name: "La Trattoria", description: "Italiana", address: "Calle 5" }
            mockPool.query.mockResolvedValue({ rows: [restaurant] })

            const dao = new RestaurantPostgresDAO()
            const result = await dao.create({
                name: "La Trattoria",
                description: "Italiana",
                address: "Calle 5"
            })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO restaurants"),
                ["La Trattoria", "Italiana", "Calle 5"]
            )
            expect(result).toEqual(restaurant)
        })
    })

    describe("update", () => {
        it("actualiza restaurante correctamente", async () => {
            const updated = { id: 1, name: "Nuevo Nombre" }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new RestaurantPostgresDAO()
            const result = await dao.update(1, {
                name: "Nuevo Nombre",
                description: "Nueva desc",
                address: "Nueva dirección"
            })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE restaurants"),
                ["Nuevo Nombre", "Nueva desc", "Nueva dirección", 1]
            )
            expect(result).toEqual(updated)
        })
    })

    describe("delete", () => {
        it("elimina restaurante por id", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new RestaurantPostgresDAO()
            await dao.delete(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                "DELETE FROM restaurants WHERE id = $1",
                [1]
            )
        })
    })
})