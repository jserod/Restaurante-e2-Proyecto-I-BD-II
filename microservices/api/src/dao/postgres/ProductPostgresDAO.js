const pool = require("../../config/database")
const IProductDAO = require("../interfaces/IProductDAO")

class ProductPostgresDAO extends IProductDAO {

  async getAll() {
    const result = await pool.query(
      `SELECT p.id, p.menu_id, p.name, p.description, p.price, p.is_available,
              m.name as menu_name, m.restaurant_id
       FROM products p
       JOIN menus m ON m.id = p.menu_id
       ORDER BY p.id`
    )
    return result.rows
  }

  async getById(id) {
    const result = await pool.query(
      `SELECT p.id, p.menu_id, p.name, p.description, p.price, p.is_available,
              m.name as menu_name, m.restaurant_id
       FROM products p
       JOIN menus m ON m.id = p.menu_id
       WHERE p.id = $1`,
      [id]
    )
    return result.rows[0]
  }

  async create({ menuId, name, description, price, isAvailable }) {
    const result = await pool.query(
      `INSERT INTO products (menu_id, name, description, price, is_available)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, menu_id, name, description, price, is_available`,
      [menuId, name, description || null, price, isAvailable !== false]
    )
    return result.rows[0]
  }

  async update(id, data) {
    const fields = []
    const values = []
    let i = 1

    if (data.menuId !== undefined) {
      fields.push(`menu_id = $${i++}`)
      values.push(data.menuId)
    }
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
    if (data.isAvailable !== undefined) {
      fields.push(`is_available = $${i++}`)
      values.push(data.isAvailable)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update")
    }

    values.push(id)

    const result = await pool.query(
      `UPDATE products
       SET ${fields.join(", ")}
       WHERE id = $${i}
       RETURNING id, menu_id, name, description, price, is_available`,
      values
    )

    return result.rows[0]
  }

  async delete(id) {
    await pool.query(
      "DELETE FROM products WHERE id = $1",
      [id]
    )
  }
}

module.exports = ProductPostgresDAO