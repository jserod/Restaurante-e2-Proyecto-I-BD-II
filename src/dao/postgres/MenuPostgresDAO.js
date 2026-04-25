const pool = require("../../config/database")
const IMenuDAO = require("../interfaces/IMenuDAO")

class MenuPostgresDAO extends IMenuDAO {

  async getAll() {
    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, price
       FROM menus
       ORDER BY id`
    )
    return result.rows
  }

  async getById(id) {
    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, price
       FROM menus
       WHERE id = $1`,
      [id]
    )
    return result.rows[0]
  }

  async getByRestaurant(restaurantId) {
    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, price
       FROM menus
       WHERE restaurant_id = $1
       ORDER BY id`,
      [restaurantId]
    )
    return result.rows
  }

  async create({ restaurantId, name, description, price }) {
    const result = await pool.query(
      `INSERT INTO menus (restaurant_id, name, description, price)
       VALUES ($1, $2, $3, $4)
       RETURNING id, restaurant_id, name, description, price`,
      [restaurantId, name, description, price]
    )
    return result.rows[0]
  }

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

    if (data.price !== undefined) {
      fields.push(`price = $${i++}`)
      values.push(data.price)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update")
    }

    values.push(id)

    const result = await pool.query(
      `UPDATE menus
       SET ${fields.join(", ")}
       WHERE id = $${i}
       RETURNING id, restaurant_id, name, description, price`,
      values
    )

    return result.rows[0]
  }

  async delete(id) {
    await pool.query(
      "DELETE FROM menus WHERE id = $1",
      [id]
    )
  }
}

module.exports = MenuPostgresDAO