/**
 * @fileoverview DAO de restaurantes para PostgreSQL.
 * CRUD simple sobre tabla restaurants.
 */

const pool = require("../../config/database")
const IRestaurantDAO = require("../interfaces/IRestaurantDAO")

class RestaurantPostgresDAO extends IRestaurantDAO {

  /**
   * Obtiene todos los restaurantes ordenados por ID.
   * @returns {Promise<Array>}
   */
  async getAll() {
    const result = await pool.query(
      "SELECT * FROM restaurants ORDER BY id"
    )
    return result.rows
  }

  /**
   * Busca un restaurante por su ID.
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [id]
    )
    return result.rows[0]
  }

  /**
   * Crea un nuevo restaurante.
   * @param {Object} data
   * @param {string} data.name
   * @param {string} [data.description]
   * @param {string} [data.address]
   * @returns {Promise<Object>}
   */
  async create({ name, description, address }) {
    const result = await pool.query(
      `INSERT INTO restaurants (name, description, address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, address]
    )
    return result.rows[0]
  }

  /**
   * Actualiza un restaurante existente.
   * @param {string|number} id
   * @param {Object} data
   * @param {string} data.name
   * @param {string} data.description
   * @param {string} data.address
   * @returns {Promise<Object|null>}
   */
  async update(id, { name, description, address }) {
    const result = await pool.query(
      `UPDATE restaurants
       SET name = $1, description = $2, address = $3
       WHERE id = $4
       RETURNING *`,
      [name, description, address, id]
    )
    return result.rows[0]
  }

  /**
   * Elimina un restaurante por su ID.
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await pool.query(
      "DELETE FROM restaurants WHERE id = $1",
      [id]
    )
  }
}

module.exports = RestaurantPostgresDAO