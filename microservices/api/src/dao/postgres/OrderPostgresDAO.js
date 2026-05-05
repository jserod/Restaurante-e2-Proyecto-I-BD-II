/**
 * @fileoverview DAO de órdenes para PostgreSQL.
 * Las órdenes usan transacciones para mantener consistencia entre orders y order_items.
 * Calcula el total sumando precios de productos.
 */

const pool = require("../../config/database")
const IOrderDAO = require("../interfaces/IOrderDAO")

class OrderPostgresDAO extends IOrderDAO {

  /**
   * Busca una orden por ID con sus ítems enriquecidos (JOIN con products).
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
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

  /**
   * Obtiene todas las órdenes con sus ítems enriquecidos.
   * @returns {Promise<Array>}
   */
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

  /**
   * Crea una orden dentro de una transacción.
   * Valida existencia de productos y calcula el total automáticamente.
   * @param {Object} data
   * @param {string|number} data.userId
   * @param {string|number} data.restaurantId
   * @param {string|number} [data.reservationId]
   * @param {boolean} [data.pickup=false]
   * @param {Array<{productId, quantity}>} data.items
   * @returns {Promise<Object>} Orden creada
   */
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

  /**
   * Actualiza el estado de una orden.
   * @param {string|number} id
   * @param {Object} data
   * @param {string} data.status
   * @returns {Promise<Object|null>}
   */
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

  /**
   * Elimina una orden por su ID.
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await pool.query(
      "DELETE FROM orders WHERE id = $1",
      [id]
    )
  }
}

module.exports = OrderPostgresDAO