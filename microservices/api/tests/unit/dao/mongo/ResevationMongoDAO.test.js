const { createMockCollection, createMockDb, createMockGetDb } = require("../../../helpers/mockMongo")

describe("ReservationMongoDAO", () => {
    let ReservationMongoDAO
    let mockCollection
    let mockDb
    let mockGetDb

    beforeEach(() => {
        jest.resetModules()

        mockCollection = createMockCollection()
        mockDb = createMockDb(mockCollection)
        mockGetDb = createMockGetDb(mockDb)

        jest.doMock("../../../../src/config/database", () => mockGetDb)
        ReservationMongoDAO = require("../../../../src/dao/mongo/ReservationMongoDAO")
    })

    describe("getAll", () => {
        it("retorna todas las reservas con lookups", async () => {
            const reservations = [
                {
                    _id: "1",
                    user_id: "u1",
                    restaurant_id: "r1",
                    guest: "Ana",
                    restaurant: "Rest 1"
                }
            ]
            mockCollection.toArray.mockResolvedValue(reservations)

            const dao = new ReservationMongoDAO()
            const result = await dao.getAll()

            expect(mockDb.collection).toHaveBeenCalledWith("reservations")
            expect(mockCollection.aggregate).toHaveBeenCalled()
            expect(result).toEqual(reservations)
        })
    })

    describe("getById", () => {
        it("retorna reserva por id con lookups", async () => {
            const reservation = {
                _id: "507f1f77bcf86cd799439011",
                guest: "Ana",
                restaurant: "Rest 1"
            }
            mockCollection.toArray.mockResolvedValue([reservation])

            const dao = new ReservationMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd799439011")

            expect(mockCollection.aggregate).toHaveBeenCalled()
            expect(result).toEqual(reservation)
        })

        it("retorna null si no existe", async () => {
            mockCollection.toArray.mockResolvedValue([])

            const dao = new ReservationMongoDAO()
            const result = await dao.getById("507f1f77bcf86cd7994390ff")

            expect(result).toBeNull()
        })
    })

    describe("create", () => {
        it("crea reserva con notes", async () => {
            const insertedId = "507f1f77bcf86cd799439011"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            const created = { _id: insertedId, status: "active" }
            mockCollection.findOne.mockResolvedValue(created)

            const dao = new ReservationMongoDAO()
            const result = await dao.create({
                userId: "507f1f77bcf86cd799439012",
                restaurantId: "507f1f77bcf86cd799439013",
                partySize: 4,
                reservationDate: "2025-06-01T20:00:00Z",
                notes: "Mesa cerca ventana"
            })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                user_id: expect.any(Object),
                restaurant_id: expect.any(Object),
                party_size: 4,
                reservation_date: expect.any(Date),
                status: "active",
                notes: "Mesa cerca ventana",
                created_at: expect.any(Date)
            }))
            expect(result).toEqual(created)
        })

        it("crea reserva sin notes (null por defecto)", async () => {
            const insertedId = "507f1f77bcf86cd799439011"
            mockCollection.insertOne.mockResolvedValue({ insertedId })
            mockCollection.findOne.mockResolvedValue({ _id: insertedId })

            const dao = new ReservationMongoDAO()
            await dao.create({
                userId: "507f1f77bcf86cd799439012",
                restaurantId: "507f1f77bcf86cd799439013",
                partySize: 2,
                reservationDate: "2025-06-01T20:00:00Z"
            })

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                notes: null
            }))
        })
    })

    describe("update", () => {
        it("actualiza todos los campos", async () => {
            const updated = {
                _id: "507f1f77bcf86cd799439011",
                party_size: 6,
                reservation_date: new Date("2025-07-01T20:00:00Z"),
                notes: "Nota actualizada"
            }
            mockCollection.findOneAndUpdate.mockResolvedValue(updated)

            const dao = new ReservationMongoDAO()
            const result = await dao.update("507f1f77bcf86cd799439011", {
                partySize: 6,
                reservationDate: "2025-07-01T20:00:00Z",
                notes: "Nota actualizada"
            })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                {
                    $set: {
                        party_size: 6,
                        reservation_date: expect.any(Date),
                        notes: "Nota actualizada"
                    }
                },
                { returnDocument: "after" }
            )
            expect(result).toEqual(updated)
        })

        it("actualiza solo partySize", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new ReservationMongoDAO()
            await dao.update("507f1f77bcf86cd799439011", { partySize: 8 })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { party_size: 8 } },
                expect.any(Object)
            )
        })

        it("actualiza solo reservationDate", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new ReservationMongoDAO()
            await dao.update("507f1f77bcf86cd799439011", { reservationDate: "2025-08-01T20:00:00Z" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { reservation_date: expect.any(Date) } },
                expect.any(Object)
            )
        })

        it("actualiza solo notes", async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue({})

            const dao = new ReservationMongoDAO()
            await dao.update("507f1f77bcf86cd799439011", { notes: "Solo notas" })

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { notes: "Solo notas" } },
                expect.any(Object)
            )
        })
    })

    describe("cancel", () => {
        it("cancela reserva cambiando status", async () => {
            const cancelled = { _id: "507f1f77bcf86cd799439011", status: "cancelled" }
            mockCollection.findOneAndUpdate.mockResolvedValue(cancelled)

            const dao = new ReservationMongoDAO()
            const result = await dao.cancel("507f1f77bcf86cd799439011")

            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: expect.any(Object) },
                { $set: { status: "cancelled" } },
                { returnDocument: "after" }
            )
            expect(result).toEqual(cancelled)
        })
    })
})