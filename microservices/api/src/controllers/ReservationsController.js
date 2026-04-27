const reservationService = require("../services/reservationService")

async function createReservation(req, res, next) {
    try {
        const { restaurantId, partySize, reservationDate, notes } = req.body
        const reservation = await reservationService.create({
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
        const updated = await reservationService.cancel(req.params.id, req.user.dbId)
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function getAllReservations(req, res, next) {
    try {
        const reservations = await reservationService.getAll()
        res.json(reservations)
    } catch (error) {
        next(error)
    }
}

async function updateReservation(req, res, next) {
    try {
        const { partySize, reservationDate, notes } = req.body
        const updated = await reservationService.update(
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
        const reservation = await reservationService.getById(req.params.id)
        res.json(reservation)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createReservation,
    cancelReservation,
    getAllReservations,
    updateReservation,
    getReservationById
}