/**
 * @fileoverview Service de reservaciones. Incluye validación de propiedad al cancelar.
 */

const DAOFactory = require("../dao/DAOFactory")
const reservationDAO = DAOFactory.getReservationDAO()
const { NotFoundError, ForbiddenError } = require("../errors")

class ReservationService {

    /** @returns {Promise<Array>} */
    async getAll() {
        return reservationDAO.getAll()
    }

    /**
     * Busca una reservación por ID. Lanza NotFoundError si no existe.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getById(id) {
        const reservation = await reservationDAO.getById(id)
        if (!reservation) {
            throw new NotFoundError("Reservation not found")
        }
        return reservation
    }

    /**
     * Crea una nueva reservación.
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        return reservationDAO.create(data)
    }

    /**
     * Actualiza una reservación existente. Verifica existencia y propiedad.
     * @param {string} id - ID de la reservación
     * @param {Object} data - Datos a actualizar
     * @param {string} userId - ID del usuario autenticado
     * @returns {Promise<Object>}
     * @throws {ForbiddenError} Si el usuario no es el propietario
     */
    async update(id, data, userId) {
        const reservation = await this.getById(id)
        if (reservation.user_id !== userId) {
            throw new ForbiddenError("You can only update your own reservations")
        }
        return await reservationDAO.update(id, data)
    }

    /**
     * Cancela una reservación validando que el usuario sea el propietario.
     * @param {string} id - ID de la reservación
     * @param {string} userId - ID del usuario autenticado
     * @returns {Promise<Object>}
     * @throws {ForbiddenError} Si el usuario no es el propietario
     */
    async cancel(id, userId) {
        const reservation = await this.getById(id)
        if (reservation.user_id !== userId) {
            throw new ForbiddenError("You can only cancel your own reservations")
        }
        return await reservationDAO.cancel(id)
    }
}

module.exports = new ReservationService()