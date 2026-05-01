const { createMockPool } = require("../../../helpers/mockPool")

describe("ReservationPostgresDAO", () => {
    let ReservationPostgresDAO
    let mockPool

    beforeEach(() => {
        jest.resetModules()

        const mocks = createMockPool()
        mockPool = mocks.mockPool

        jest.doMock("../../../../src/config/database", () => mockPool)
        ReservationPostgresDAO = require("../../../../src/dao/postgres/ReservationPostgresDAO")
    })

    describe("getAll", () => {
        it("retorna todas las reservas activas con JOIN", async () => {
            const reservations = [
                { id: 1, guest: "Juan", restaurant: "La Trattoria" }
            ]
            mockPool.query.mockResolvedValue({ rows: reservations })

            const dao = new ReservationPostgresDAO()
            const result = await dao.getAll()

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("LEFT JOIN users u ON u.id = r.user_id")
            )
            expect(result).toEqual(reservations)
        })
    })

    describe("getById", () => {
        it("retorna reserva por id", async () => {
            const reservation = { id: 1, guest: "Juan" }
            mockPool.query.mockResolvedValue({ rows: [reservation] })

            const dao = new ReservationPostgresDAO()
            const result = await dao.getById(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("WHERE r.id = $1"),
                [1]
            )
            expect(result).toEqual(reservation)
        })

        it("retorna undefined si no existe", async () => {
            mockPool.query.mockResolvedValue({ rows: [] })

            const dao = new ReservationPostgresDAO()
            const result = await dao.getById(999)

            expect(result).toBeUndefined()
        })
    })

    describe("create", () => {
        it("inserta una reserva correctamente", async () => {
            const reservation = { id: 1, user_id: 5, restaurant_id: 10 }
            mockPool.query.mockResolvedValue({ rows: [reservation] })

            const dao = new ReservationPostgresDAO()
            const result = await dao.create({
                userId: 5,
                restaurantId: 10,
                partySize: 4,
                reservationDate: "2026-05-01T19:00:00Z",
                notes: "Mesa exterior"
            })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO reservations"),
                [5, 10, 4, "2026-05-01T19:00:00Z", "Mesa exterior"]
            )
            expect(result).toEqual(reservation)
        })
    })

    describe("update", () => {
        it("actualiza una reserva correctamente", async () => {
            const updated = { id: 1, party_size: 6 }
            mockPool.query.mockResolvedValue({ rows: [updated] })

            const dao = new ReservationPostgresDAO()
            const result = await dao.update(1, {
                partySize: 6,
                reservationDate: "2026-05-02T20:00:00Z",
                notes: "Aniversario"
            })

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE reservations"),
                [6, "2026-05-02T20:00:00Z", "Aniversario", 1]
            )
            expect(result).toEqual(updated)
        })
    })

    describe("cancel", () => {
        it("cancela una reserva cambiando status a cancelled", async () => {
            const cancelled = { id: 1, status: "cancelled" }
            mockPool.query.mockResolvedValue({ rows: [cancelled] })

            const dao = new ReservationPostgresDAO()
            const result = await dao.cancel(1)

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining("status = 'cancelled'"),
                [1]
            )
            expect(result).toEqual(cancelled)
        })
    })
})