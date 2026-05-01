// tests/unit/services/reservationService.test.js

const { NotFoundError, ForbiddenError } = require("../../../src/errors")

describe("ReservationService", () => {

    let reservationService
    let reservationDAO

    beforeEach(() => {
        jest.resetModules()

        reservationDAO = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn()
        }

        jest.doMock("../../../src/dao/DAOFactory", () => ({
            getReservationDAO: () => reservationDAO
        }))

        reservationService = require("../../../src/services/reservationService")
    })

    describe("getAll", () => {
        it("retorna todas las reservas", async () => {
            reservationDAO.getAll.mockResolvedValue([{ id: 1 }])

            const result = await reservationService.getAll()

            expect(result).toEqual([{ id: 1 }])
            expect(reservationDAO.getAll).toHaveBeenCalled()
        })
    })

    describe("getById", () => {
        it("retorna reserva si existe", async () => {
            reservationDAO.getById.mockResolvedValue({ id: 1 })

            const result = await reservationService.getById(1)

            expect(result).toEqual({ id: 1 })
        })

        it("lanza NotFoundError si no existe", async () => {
            reservationDAO.getById.mockResolvedValue(null)

            await expect(reservationService.getById(1))
                .rejects
                .toThrow("Reservation not found")
        })
    })

    describe("create", () => {
        it("crea una reserva", async () => {
            const data = { user_id: 1 }

            reservationDAO.create.mockResolvedValue(data)

            const result = await reservationService.create(data)

            expect(result).toEqual(data)
            expect(reservationDAO.create).toHaveBeenCalledWith(data)
        })
    })

    describe("update", () => {
        it("actualiza si existe", async () => {
            reservationDAO.getById.mockResolvedValue({ id: 1 })
            reservationDAO.update.mockResolvedValue({ id: 1, updated: true })

            const result = await reservationService.update(1, { foo: "bar" })

            expect(reservationDAO.update).toHaveBeenCalledWith(1, { foo: "bar" })
            expect(result).toEqual({ id: 1, updated: true })
        })

        it("lanza error si no existe", async () => {
            reservationDAO.getById.mockResolvedValue(null)

            await expect(reservationService.update(1, {}))
                .rejects
                .toThrow("Reservation not found")
        })
    })

    describe("cancel", () => {

        it("cancela si es el dueño", async () => {
            const reservation = { id: 1, user_id: 10 }

            reservationDAO.getById.mockResolvedValue(reservation)
            reservationDAO.cancel.mockResolvedValue({ cancelled: true })

            const result = await reservationService.cancel(1, 10)

            expect(reservationDAO.cancel).toHaveBeenCalledWith(1)
            expect(result).toEqual({ cancelled: true })
        })

        it("lanza NotFoundError si no existe", async () => {
            reservationDAO.getById.mockResolvedValue(null)

            await expect(reservationService.cancel(1, 10))
                .rejects
                .toThrow("Reservation not found")
        })

        it("lanza ForbiddenError si no es el dueño", async () => {
            reservationDAO.getById.mockResolvedValue({
                id: 1,
                user_id: 999
            })

            await expect(reservationService.cancel(1, 10))
                .rejects
                .toThrow("You can only cancel your own reservations")
        })

    })

})