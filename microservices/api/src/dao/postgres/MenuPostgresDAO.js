/**
 * @fileoverview DAO de menús para PostgreSQL.
 * Los menús son tablas con referencia a restaurantes (foreign key).
 */

const pool = require("../../config/database")
const IMenuDAO = require("../interfaces/IMenuDAO")

class MenuPostgresDAO extends IMenuDAO {

  /**
   * Obtiene todos los menús con datos del restaurante asociado.
   * @returns {Promise<Array>}
   */
  async getAll() {
    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, created_at
       FROM menus
       ORDER BY id`
    )
    return result.rows
  }

  /**
   * Busca un menú por su ID.
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, created_at
       FROM menus
       WHERE id = $1`,
      [id]
    )
    return result.rows[0]
  }

  /**
   * Obtiene todos los menús de un restaurante específico.
   * @param {string|number} restaurantId
   * @returns {Promise<Array>}
   */
  async getByRestaurant(restaurantId) {
    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, created_at
       FROM menus
       WHERE restaurant_id = $1
       ORDER BY id`,
      [restaurantId]
    )
    return result.rows
  }

  /**
   * Crea un nuevo menú asociado a un restaurante.
   * @param {Object} data
   * @param {string|number} data.restaurantId
   * @param {string} data.name
   * @param {string} [data.description]
   * @returns {Promise<Object>}
   */
  async create({ restaurantId, name, description }) {
    const result = await pool.query(
      `INSERT INTO menus (restaurant_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, restaurant_id, name, description, created_at`,
      [restaurantId, name, description || null]
    )
    return result.rows[0]
  }

  /**
   * Actualiza campos específicos de un menú (update parcial).
   * @param {string|number} id
   * @param {Object} data
   * @param {string} [data.name]
   * @param {string} [data.description]
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const fields = []
    const values = []
    let i = 1

    if (data.name !== undefined) {
      fields.push(`name = $${i++}`)
      values.push(data.name)
    }

    if (data.description !== undefined) {
      fields.push(`description = $${i++}`)
      values.push(data.description)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update")
    }

    values.push(id)

    const result = await pool.query(
      `UPDATE menus
       SET ${fields.join(", ")}
       WHERE id = $${i}
       RETURNING id, restaurant_id, name, description, created_at`,
      values
    )

    return result.rows[0]
  }

  /**
   * Elimina un menú por su ID.
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await pool.query(
      "DELETE FROM menus WHERE id = $1",
      [id]
    )
  }
}

module.exports = MenuPostgresDAO