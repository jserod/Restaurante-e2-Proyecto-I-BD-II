const reservationsModel = require("../models/reservations")

async function createReservation(req, res, next) {
    try {
        const { restaurantId, partySize, reservationDate, notes } = req.body
        const reservation = await reservationsModel.createReservation({
            userId: req.user.id,
            restaurantId,
            partySize,
            reservationDate,
            notes
        })
        res.status(201).json(reservation)
    } catch (error) {
        next(error)
    }
}

async function cancelReservation(req, res, next) {
    try {
        const reservation = await reservationsModel.getReservationById(req.params.id)
        if (!reservation) return res.status(404).json({ error: "Reservation not found" })

        if (reservation.user_id !== req.user.dbId) {
            return res.status(403).json({ error: "Forbidden" })
        }

        const updated = await reservationsModel.cancelReservation(req.params.id)
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function getAllReservations(req, res, next) {
    try {
        const reservations = await reservationsModel.getAllReservations()
        res.json(reservations)
    } catch (error) {
        next(error)
    }
}

async function updateReservation(req, res, next) {
    try {
        const reservation = await reservationsModel.getReservationById(req.params.id)
        if (!reservation) return res.status(404).json({ error: "Reservation not found" })

        const { partySize, reservationDate, notes } = req.body
        const updated = await reservationsModel.updateReservation(
            req.params.id,
            { partySize, reservationDate, notes }
        )
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function getReservationById(req, res, next) {
    try {
        const reservation = await reservationsModel.getReservationById(req.params.id)
        if (!reservation) return res.status(404).json({ error: "Reservation not found" })
        res.json(reservation)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAllReservations,
    createReservation,
    cancelReservation,
    updateReservation,
    getReservationById
}