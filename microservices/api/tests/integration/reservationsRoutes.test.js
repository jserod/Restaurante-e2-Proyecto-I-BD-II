// tests/integration/reservationsRoutes.test.js
const request = require("supertest")
const express = require("express")
const { NotFoundError, ForbiddenError } = require("../../src/errors")

describe("Reservations Routes", () => {
    let app
    let mockReservationService

    beforeEach(() => {
        jest.resetModules()

        mockReservationService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn()
        }

        // Mock del service ANTES de cargar el controller
        jest.doMock("../../src/services/reservationService", () => mockReservationService)

        // Mock de middlewares de auth
        jest.doMock("../../src/middlewares/keycloakProtect", () => {
            return () => (req, res, next) => next()
        })
        
        jest.doMock("../../src/middlewares/attachUser", () => {
            return (req, res, next) => {
                req.user = { id: "test-user-id", dbId: "test-db-id" }
                next()
            }
        })

        const reservationsRoutes = require("../../src/routes/reservationsRoutes")
        
        app = express()
        app.use(express.json())
        app.use("/reservations", reservationsRoutes)
        
        // Error handler
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message })
        })
    })

    describe("GET /reservations", () => {
        it("retorna todas las reservas", async () => {
            const reservations = [{ _id: "1", status: "active" }]
            mockReservationService.getAll.mockResolvedValue(reservations)

            const res = await request(app).get("/reservations")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(reservations)
            expect(mockReservationService.getAll).toHaveBeenCalled()
        })
    })

    describe("GET /reservations/:id", () => {
        it("retorna reserva por id", async () => {
            const reservation = { _id: "1", status: "active" }
            mockReservationService.getById.mockResolvedValue(reservation)

            const res = await request(app).get("/reservations/1")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(reservation)
            expect(mockReservationService.getById).toHaveBeenCalledWith("1")
        })

        it("retorna 404 si no existe", async () => {
            mockReservationService.getById.mockRejectedValue(new NotFoundError("Reservation not found"))

            const res = await request(app).get("/reservations/999")

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("Reservation not found")
        })
    })

    describe("POST /reservations", () => {
        it("crea reserva con datos validos", async () => {
            const created = { _id: "1", status: "active" }
            mockReservationService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/reservations")
                .send({
                    restaurantId: "507f1f77bcf86cd799439012",
                    partySize: 4,
                    reservationDate: "2025-06-01T20:00:00Z",
                    notes: "Mesa cerca ventana"
                })

            expect(res.status).toBe(201)
            expect(res.body).toEqual(created)
            expect(mockReservationService.create).toHaveBeenCalledWith({
                userId: "test-user-id",
                restaurantId: "507f1f77bcf86cd799439012",
                partySize: 4,
                reservationDate: "2025-06-01T20:00:00Z",
                notes: "Mesa cerca ventana"
            })
        })

        it("crea reserva sin notes", async () => {
            const created = { _id: "1", status: "active" }
            mockReservationService.create.mockResolvedValue(created)

            const res = await request(app)
                .post("/reservations")
                .send({
                    restaurantId: "507f1f77bcf86cd799439012",
                    partySize: 2,
                    reservationDate: "2025-06-01T20:00:00Z"
                })

            expect(res.status).toBe(201)
            expect(mockReservationService.create).toHaveBeenCalledWith({
                userId: "test-user-id",
                restaurantId: "507f1f77bcf86cd799439012",
                partySize: 2,
                reservationDate: "2025-06-01T20:00:00Z",
                notes: undefined
            })
        })
    })

    describe("PUT /reservations/:id", () => {
        it("actualiza reserva", async () => {
            const updated = { _id: "1", partySize: 6 }
            mockReservationService.update.mockResolvedValue(updated)

            const res = await request(app)
                .put("/reservations/1")
                .send({ partySize: 6, notes: "Nota actualizada" })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(updated)
            expect(mockReservationService.update).toHaveBeenCalledWith("1", {
                partySize: 6,
                reservationDate: undefined,
                notes: "Nota actualizada"
            })
        })

        it("retorna 404 si no existe", async () => {
            mockReservationService.update.mockRejectedValue(new NotFoundError("Reservation not found"))

            const res = await request(app)
                .put("/reservations/999")
                .send({ partySize: 6 })

            expect(res.status).toBe(404)
        })
    })

    describe("DELETE /reservations/:id", () => {
        it("cancela reserva propia", async () => {
            const cancelled = { _id: "1", status: "cancelled" }
            mockReservationService.cancel.mockResolvedValue(cancelled)

            const res = await request(app).delete("/reservations/1")

            expect(res.status).toBe(200)
            expect(res.body).toEqual(cancelled)
            expect(mockReservationService.cancel).toHaveBeenCalledWith("1", "test-db-id")
        })

        it("retorna 404 si no existe", async () => {
            mockReservationService.cancel.mockRejectedValue(new NotFoundError("Reservation not found"))

            const res = await request(app).delete("/reservations/999")

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("Reservation not found")
        })

        it("retorna 403 si no es del usuario", async () => {
            mockReservationService.cancel.mockRejectedValue(new ForbiddenError("You can only cancel your own reservations"))

            const res = await request(app).delete("/reservations/1")

            expect(res.status).toBe(403)
            expect(res.body.error).toBe("You can only cancel your own reservations")
        })
    })
})