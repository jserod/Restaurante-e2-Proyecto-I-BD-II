const pool = require("../config/database")

async function getAllUsers() {
  const result = await pool.query(
    "SELECT id, keycloak_id, email, name, role FROM users ORDER BY id"
  )
  return result.rows
}

async function findOrCreateUser({ keycloakId, email, name }) {
  // buscar por keycloak_id
  let result = await pool.query(
    "SELECT * FROM users WHERE keycloak_id = $1",
    [keycloakId]
  )

  if (result.rows.length > 0) return result.rows[0]

  // buscar por email (por si ya existia con otro keycloak_id)
  result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  )

  if (result.rows.length > 0) {
    // actualizar el keycloak_id al nuevo
    result = await pool.query(
      `UPDATE users SET keycloak_id = $1 WHERE email = $2 RETURNING *`,
      [keycloakId, email]
    )
    return result.rows[0]
  }

  // crear usuario nuevo
  result = await pool.query(
    `INSERT INTO users (keycloak_id, email, name)
         VALUES ($1, $2, $3)
         RETURNING *`,
    [keycloakId, email, name]
  )

  return result.rows[0]
}

async function getUserById(id) {
  const result = await pool.query(
    "SELECT id, keycloak_id, email, name, role FROM users WHERE id = $1",
    [id]
  )
  return result.rows[0]
}

async function updateUser(id, { name, email }) {
  const result = await pool.query(
    `UPDATE users
         SET name = $1, email = $2
         WHERE id = $3
         RETURNING id, keycloak_id, email, name, role`,
    [name, email, id]
  )
  return result.rows[0]
}
async function deleteUser(id) {
  await pool.query("DELETE FROM users WHERE id = $1", [id])
}

async function createUser({ keycloakId, email, name, role }) {
  const result = await pool.query(
    `INSERT INTO users (keycloak_id, email, name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, keycloak_id, email, name, role`,
    [keycloakId, email, name, role || "client"]
  )
  return result.rows[0]
}

module.exports = {
  getAllUsers,
  findOrCreateUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}