/**
 * @fileoverview DAO de usuarios para PostgreSQL.
 * Sincroniza usuarios locales con Keycloak mediante keycloak_id.
 */


const pool = require("../../config/database")
const IUserDAO = require("../interfaces/IUserDAO")

class UserPostgresDAO extends IUserDAO {

    /**
     * Obtiene todos los usuarios con campos esenciales.
     * @returns {Promise<Array>}
     */
    async getAllUsers() {
        const result = await pool.query(
            "SELECT id, keycloak_id, email, name, role FROM users ORDER BY id"
        )
        return result.rows
    }

    /**
     * Busca un usuario por su ID interno.
     * @param {string|number} id
     * @returns {Promise<Object|null>}
     */
    async getUserById(id) {
        const result = await pool.query(
            "SELECT id, keycloak_id, email, name, role FROM users WHERE id = $1",
            [id]
        )
        return result.rows[0]
    }

    /**
     * Crea un nuevo usuario vinculado a Keycloak.
     * @param {Object} data
     * @param {string} data.keycloakId
     * @param {string} data.email
     * @param {string} data.name
     * @param {string} [data.role="client"]
     * @returns {Promise<Object>}
     */
    async createUser({ keycloakId, email, name, role }) {
        const result = await pool.query(
            `INSERT INTO users (keycloak_id, email, name, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, keycloak_id, email, name, role`,
            [keycloakId, email, name, role || "client"]
        )
        return result.rows[0]
    }

    /**
     * Actualiza datos de un usuario por su keycloak_id.
     * @param {string} keycloakId
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.email
     * @returns {Promise<Object|null>}
     */
    async updateUser(keycloakId, { name, email }) {
        const result = await pool.query(
            `UPDATE users
             SET name = $1, email = $2
             WHERE keycloak_id = $3
             RETURNING id, keycloak_id, email, name, role`,
            [name, email, keycloakId]
        )
        return result.rows[0]
    }

    /**
     * Elimina un usuario por su ID interno.
     * @param {string|number} id
     * @returns {Promise<void>}
     */
    async deleteUser(id) {
        await pool.query("DELETE FROM users WHERE id = $1", [id])
    }

    /**
     * Busca un usuario por su ID de Keycloak.
     * @param {string} keycloakId
     * @returns {Promise<Object|null>}
     */
    async getUserByKeycloakId(keycloakId) {
        const result = await pool.query(
            "SELECT * FROM users WHERE keycloak_id = $1",
            [keycloakId]
        )
        return result.rows[0]
    }

    /**
     * Busca un usuario por email.
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    async getUserByEmail(email) {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        )
        return result.rows[0]
    }
}

module.exports = UserPostgresDAO