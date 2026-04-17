const pool = require("../config/database")

async function getReservationById(id) {
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

async function createReservation({ userId, restaurantId, partySize, reservationDate, notes }) {
    const result = await pool.query(
        `INSERT INTO reservations (user_id, restaurant_id, party_size, reservation_date, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, restaurantId, partySize, reservationDate, notes]
    )
    return result.rows[0]
}

async function cancelReservation(id) {
    const result = await pool.query(
        `UPDATE reservations
         SET status = 'cancelled'
         WHERE id = $1
         RETURNING *`,
        [id]
    )
    return result.rows[0]
}

async function getAllReservations() {
    const result = await pool.query(
        `SELECT r.*, u.name AS guest, res.name AS restaurant
         FROM reservations r
         LEFT JOIN users u ON u.id = r.user_id
         LEFT JOIN restaurants res ON res.id = r.restaurant_id
         ORDER BY r.id`
    )
    return result.rows
}

async function updateReservation(id, { partySize, reservationDate, notes }) {
    const result = await pool.query(
        `UPDATE reservations
         SET party_size = $1, reservation_date = $2, notes = $3
         WHERE id = $4
         RETURNING *`,
        [partySize, reservationDate, notes, id]
    )
    return result.rows[0]
}

module.exports = {
    getAllReservations,
    getReservationById,
    createReservation,
    cancelReservation,
    updateReservation
}