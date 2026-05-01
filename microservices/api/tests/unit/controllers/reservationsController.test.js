// tests/unit/controllers/reservationsController.test.js
const { createMockReq, createMockRes, createMockNext } = require("../../helpers/mockExpress")

describe("reservationsController", () => {
    let reservationsController
    let reservationService

    beforeEach(() => {
        jest.resetModules()

        reservationService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn()
        }

        jest.doMock("../../../src/services/reservationService", () => reservationService)
        reservationsController = require("../../../src/controllers/reservationsController")
    })

    describe("createReservation", () => {
        it("crea reserva con datos válidos", async () => {
            const created = {
                id: 1,
                userId: 5,
                restaurantId: 10,
                partySize: 4,
                reservationDate: "2025-01-01T20:00:00Z",
                notes: "Mesa cerca de la ventana"
            }
            reservationService.create.mockResolvedValue(created)

            const req = createMockReq({
                user: { id: 5 },
                body: {
                    restaurantId: 10,
                    partySize: 4,
                    reservationDate: "2025-01-01T20:00:00Z",
                    notes: "Mesa cerca de la ventana"
                }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.createReservation(req, res, next)

            expect(reservationService.create).toHaveBeenCalledWith({
                userId: 5,
                restaurantId: 10,
                partySize: 4,
                reservationDate: "2025-01-01T20:00:00Z",
                notes: "Mesa cerca de la ventana"
            })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith(created)
        })

        it("crea reserva sin notes", async () => {
            const created = { id: 1, userId: 5, restaurantId: 10, partySize: 2 }
            reservationService.create.mockResolvedValue(created)

            const req = createMockReq({
                user: { id: 5 },
                body: { restaurantId: 10, partySize: 2 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.createReservation(req, res, next)

            expect(reservationService.create).toHaveBeenCalledWith({
                userId: 5,
                restaurantId: 10,
                partySize: 2,
                reservationDate: undefined,
                notes: undefined
            })
        })

        it("pasa errores del service a next", async () => {
            const error = new Error("DB fail")
            reservationService.create.mockRejectedValue(error)

            const req = createMockReq({
                user: { id: 5 },
                body: { restaurantId: 10, partySize: 4 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.createReservation(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("cancelReservation", () => {
        it("cancela reserva del usuario", async () => {
            const updated = { id: 1, status: "cancelled" }
            reservationService.cancel.mockResolvedValue(updated)

            const req = createMockReq({
                user: { id: 5, dbId: 10 },
                params: { id: "1" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.cancelReservation(req, res, next)

            expect(reservationService.cancel).toHaveBeenCalledWith("1", 10)
            expect(res.json).toHaveBeenCalledWith(updated)
        })

        it("pasa errores a next (NotFound)", async () => {
            const error = new Error("Reservation not found")
            reservationService.cancel.mockRejectedValue(error)

            const req = createMockReq({
                user: { id: 5, dbId: 10 },
                params: { id: "999" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.cancelReservation(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })

        it("pasa errores a next (Forbidden)", async () => {
            const error = new Error("You can only cancel your own reservations")
            reservationService.cancel.mockRejectedValue(error)

            const req = createMockReq({
                user: { id: 5, dbId: 99 },
                params: { id: "1" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.cancelReservation(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getAllReservations", () => {
        it("retorna todas las reservas", async () => {
            const reservations = [{ id: 1 }, { id: 2 }]
            reservationService.getAll.mockResolvedValue(reservations)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.getAllReservations(req, res, next)

            expect(reservationService.getAll).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(reservations)
        })

        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            reservationService.getAll.mockRejectedValue(error)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.getAllReservations(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("updateReservation", () => {
        it("actualiza reserva", async () => {
            const updated = {
                id: 1,
                partySize: 6,
                reservationDate: "2025-01-02T20:00:00Z",
                notes: "Updated notes"
            }
            reservationService.update.mockResolvedValue(updated)

            const req = createMockReq({
                params: { id: "1" },
                body: {
                    partySize: 6,
                    reservationDate: "2025-01-02T20:00:00Z",
                    notes: "Updated notes"
                }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.updateReservation(req, res, next)

            expect(reservationService.update).toHaveBeenCalledWith("1", {
                partySize: 6,
                reservationDate: "2025-01-02T20:00:00Z",
                notes: "Updated notes"
            })
            expect(res.json).toHaveBeenCalledWith(updated)
        })

        it("actualiza reserva con campos parciales", async () => {
            const updated = { id: 1, partySize: 8 }
            reservationService.update.mockResolvedValue(updated)

            const req = createMockReq({
                params: { id: "1" },
                body: { partySize: 8 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.updateReservation(req, res, next)

            expect(reservationService.update).toHaveBeenCalledWith("1", { partySize: 8 })
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            reservationService.update.mockRejectedValue(error)

            const req = createMockReq({
                params: { id: "999" },
                body: { partySize: 4 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.updateReservation(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getReservationById", () => {
        it("retorna reserva por id", async () => {
            const reservation = { id: 1, partySize: 4 }
            reservationService.getById.mockResolvedValue(reservation)

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.getReservationById(req, res, next)

            expect(reservationService.getById).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith(reservation)
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            reservationService.getById.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await reservationsController.getReservationById(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})