const pool = require("../../config/database")
const IRestaurantDAO = require("../interfaces/IRestaurantDAO")

class RestaurantPostgresDAO extends IRestaurantDAO {

  async getAll() {
    const result = await pool.query(
      "SELECT * FROM restaurants ORDER BY id"
    )
    return result.rows
  }

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [id]
    )
    return result.rows[0]
  }

  async create({ name, description, address }) {
    const result = await pool.query(
      `INSERT INTO restaurants (name, description, address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, address]
    )
    return result.rows[0]
  }

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

  async delete(id) {
    await pool.query(
      "DELETE FROM restaurants WHERE id = $1",
      [id]
    )
  }
}

module.exports = RestaurantPostgresDAO