/**
 * @fileoverview Controlador de reservaciones. Gestiona reservas de mesas para usuarios autenticados.
 */

const reservationService = require("../services/reservationService")

/**
 * Crea una nueva reservación para el usuario autenticado.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
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

/**
 * Cancela una reservación existente del usuario autenticado.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function cancelReservation(req, res, next) {
    try {
        const updated = await reservationService.cancel(req.params.id, req.user.dbId)
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

/**
 * Obtiene todas las reservaciones del sistema.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getAllReservations(req, res, next) {
    try {
        const reservations = await reservationService.getAll()
        res.json(reservations)
    } catch (error) {
        next(error)
    }
}

/**
 * Actualiza una reservación existente. Verifica que el usuario sea el propietario.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function updateReservation(req, res, next) {
    try {
        const { partySize, reservationDate, notes } = req.body
        const updated = await reservationService.update(
            req.params.id,
            { partySize, reservationDate, notes },
            req.user.dbId
        )
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

/**
 * Obtiene una reservación por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
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