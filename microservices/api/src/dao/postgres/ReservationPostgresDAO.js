/**
 * @fileoverview DAO de reservaciones para PostgreSQL.
 * Usa JOINs para enriquecer resultados con nombres de usuario y restaurante.
 */

const pool = require("../../config/database")
const IReservationDAO = require("../interfaces/IReservationDAO")

class ReservationPostgresDAO extends IReservationDAO {

    /**
     * Busca una reservación por ID con nombres de guest y restaurante.
     * @param {string|number} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        const result = await pool.query(
            `SELECT r.*, u.name AS guest, res.name AS restaurant
       FROM reservations r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN restaurants res ON res.id = r.restaurant_id
       WHERE r.id = $1`,
            [id]
        )
        return result.rows[0]
    }

    /**
     * Obtiene todas las reservaciones activas con datos enriquecidos.
     * @returns {Promise<Array>}
     */
    async getAll() {
        const result = await pool.query(
            `SELECT r.*, u.name AS guest, res.name AS restaurant
       FROM reservations r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN restaurants res ON res.id = r.restaurant_id
       WHERE r.status != 'canceled'
       ORDER BY r.id`
        )
        return result.rows
    }

    /**
     * Crea una nueva reservación.
     * @param {Object} data
     * @param {string|number} data.userId
     * @param {string|number} data.restaurantId
     * @param {number} data.partySize
     * @param {string|Date} data.reservationDate
     * @param {string} [data.notes]
     * @returns {Promise<Object>}
     */
    async create({ userId, restaurantId, partySize, reservationDate, notes }) {
        const result = await pool.query(
            `INSERT INTO reservations (user_id, restaurant_id, party_size, reservation_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [userId, restaurantId, partySize, reservationDate, notes]
        )
        return result.rows[0]
    }

    /**
     * Actualiza datos de una reservación existente.
     * @param {string|number} id
     * @param {Object} data
     * @param {number} data.partySize
     * @param {string|Date} data.reservationDate
     * @param {string} data.notes
     * @returns {Promise<Object|null>}
     */
    async update(id, { partySize, reservationDate, notes }) {
        const result = await pool.query(
            `UPDATE reservations
       SET party_size = $1,
           reservation_date = $2,
           notes = $3
       WHERE id = $4
       RETURNING *`,
            [partySize, reservationDate, notes, id]
        )
        return result.rows[0]
    }

    /**
     * Cancela una reservación cambiando su estado a 'cancelled'.
     * @param {string|number} id
     * @returns {Promise<Object|null>}
     */
    async cancel(id) {
        const result = await pool.query(
            `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
            [id]
        )
        return result.rows[0]
    }
}

module.exports = ReservationPostgresDAO