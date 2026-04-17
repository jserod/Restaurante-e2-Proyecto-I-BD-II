const pool = require("../config/database")

async function getOrderById(id) {
    const result = await pool.query(
        `SELECT o.*,
                json_agg(
                    json_build_object(
                        'menu_id', oi.menu_id,
                        'name', m.name,
                        'quantity', oi.quantity,
                        'unit_price', oi.unit_price
                    )
                ) AS items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN menus m ON m.id = oi.menu_id
         WHERE o.id = $1
         GROUP BY o.id`,
        [id]
    )
    return result.rows[0]
}

async function createOrder({ userId, restaurantId, reservationId, pickup, items }) {
    const client = await require("../config/database").connect()

    try {
        await client.query("BEGIN")

        // calcular total
        let total = 0
        for (const item of items) {
            const menuRes = await client.query(
                "SELECT price FROM menus WHERE id = $1",
                [item.menuId]
            )
            if (!menuRes.rows[0]) throw new Error(`Menu item ${item.menuId} not found`)
            total += menuRes.rows[0].price * item.quantity
        }

        // insertar orden
        const orderRes = await client.query(
            `INSERT INTO orders (user_id, restaurant_id, reservation_id, pickup, total)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, restaurantId, reservationId || null, pickup || false, total]
        )
        const order = orderRes.rows[0]

        // insertar items
        for (const item of items) {
            const priceRes = await client.query(
                "SELECT price FROM menus WHERE id = $1",
                [item.menuId]
            )
            await client.query(
                `INSERT INTO order_items (order_id, menu_id, quantity, unit_price)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, item.menuId, item.quantity, priceRes.rows[0].price]
            )
        }

        await client.query("COMMIT")
        return order
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
}

async function getAllOrders() {
    const result = await pool.query(
        `SELECT o.*,
                json_agg(
                    json_build_object(
                        'menu_id', oi.menu_id,
                        'name', m.name,
                        'quantity', oi.quantity,
                        'unit_price', oi.unit_price
                    )
                ) AS items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN menus m ON m.id = oi.menu_id
         GROUP BY o.id
         ORDER BY o.id`
    )
    return result.rows
}

async function updateOrder(id, { status }) {
    const result = await pool.query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
    )
    return result.rows[0]
}

async function deleteOrder(id) {
    await pool.query("DELETE FROM orders WHERE id = $1", [id])
}

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder
}