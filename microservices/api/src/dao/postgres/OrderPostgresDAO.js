const pool = require("../../config/database")
const IOrderDAO = require("../interfaces/IOrderDAO")

class OrderPostgresDAO extends IOrderDAO {

  async getById(id) {
    const result = await pool.query(
      `SELECT o.*,
              json_agg(
                  json_build_object(
                      'product_id', oi.product_id,
                      'name', p.name,
                      'quantity', oi.quantity,
                      'unit_price', oi.unit_price
                  )
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    )
    return result.rows[0]
  }

  async getAll() {
    const result = await pool.query(
      `SELECT o.*,
              json_agg(
                  json_build_object(
                      'product_id', oi.product_id,
                      'name', p.name,
                      'quantity', oi.quantity,
                      'unit_price', oi.unit_price
                  )
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       GROUP BY o.id
       ORDER BY o.id`
    )
    return result.rows
  }

  async create({ userId, restaurantId, reservationId, pickup, items }) {
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      let total = 0

      for (const item of items) {
        const productRes = await client.query(
          "SELECT price FROM products WHERE id = $1",
          [item.productId]
        )

        if (!productRes.rows[0]) {
          throw new Error(`Product ${item.productId} not found`)
        }

        total += productRes.rows[0].price * item.quantity
      }

      const orderRes = await client.query(
        `INSERT INTO orders (user_id, restaurant_id, reservation_id, pickup, total)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, restaurantId, reservationId || null, pickup || false, total]
      )

      const order = orderRes.rows[0]

      for (const item of items) {
        const priceRes = await client.query(
          "SELECT price FROM products WHERE id = $1",
          [item.productId]
        )

        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, priceRes.rows[0].price]
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

  async update(id, { status }) {
    const result = await pool.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    )
    return result.rows[0]
  }

  async delete(id) {
    await pool.query(
      "DELETE FROM orders WHERE id = $1",
      [id]
    )
  }
}

module.exports = OrderPostgresDAO