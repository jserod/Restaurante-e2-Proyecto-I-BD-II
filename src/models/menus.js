const pool = require("../config/database")

async function getAllMenus() {
    const result = await pool.query(
        "SELECT * FROM menus ORDER BY id"
    )
    return result.rows
}

async function getMenusByRestaurant(restaurantId) {
    const result = await pool.query(
        `SELECT * FROM menus
         WHERE restaurant_id = $1
         ORDER BY id`,
        [restaurantId]
    )
    return result.rows
}

async function getMenuById(id) {
    const result = await pool.query(
        "SELECT * FROM menus WHERE id = $1",
        [id]
    )
    return result.rows[0]
}

async function createMenu({ restaurantId, name, description, price }) {
    const result = await pool.query(
        `INSERT INTO menus (restaurant_id, name, description, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [restaurantId, name, description, price]
    )
    return result.rows[0]
}

async function updateMenu(id, { name, description, price }) {
    const result = await pool.query(
        `UPDATE menus
         SET name = $1, description = $2, price = $3
         WHERE id = $4
         RETURNING *`,
        [name, description, price, id]
    )
    return result.rows[0]
}

async function deleteMenu(id) {
    await pool.query("DELETE FROM menus WHERE id = $1", [id])
}

module.exports = {
    getAllMenus,
    getMenusByRestaurant,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu
}