const pool = require("../config/database")

async function getAllRestaurants() {
    const result = await pool.query(
        "SELECT * FROM restaurants ORDER BY id"
    )
    return result.rows
}

async function getRestaurantById(id) {
    const result = await pool.query(
        "SELECT * FROM restaurants WHERE id = $1",
        [id]
    )
    return result.rows[0]
}

async function createRestaurant({ name, description, address }) {
    const result = await pool.query(
        `INSERT INTO restaurants (name, description, address)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, description, address]
    )
    return result.rows[0]
}

async function updateRestaurant(id, { name, description, address }) {
    const result = await pool.query(
        `UPDATE restaurants
         SET name = $1, description = $2, address = $3
         WHERE id = $4
         RETURNING *`,
        [name, description, address, id]
    )
    return result.rows[0]
}

async function deleteRestaurant(id) {
    await pool.query("DELETE FROM restaurants WHERE id = $1", [id])
}

module.exports = {
    getAllRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant
}