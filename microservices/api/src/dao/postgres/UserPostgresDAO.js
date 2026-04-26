const pool = require("../../config/database")
const IUserDAO = require("../interfaces/IUserDAO")

class UserPostgresDAO extends IUserDAO {

    async getAllUsers() {
        const result = await pool.query(
            "SELECT id, keycloak_id, email, name, role FROM users ORDER BY id"
        )
        return result.rows
    }

    async getUserById(id) {
        const result = await pool.query(
            "SELECT id, keycloak_id, email, name, role FROM users WHERE id = $1",
            [id]
        )
        return result.rows[0]
    }

    async createUser({ keycloakId, email, name, role }) {
        const result = await pool.query(
            `INSERT INTO users (keycloak_id, email, name, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, keycloak_id, email, name, role`,
            [keycloakId, email, name, role || "client"]
        )
        return result.rows[0]
    }

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

    async deleteUser(id) {
        await pool.query("DELETE FROM users WHERE id = $1", [id])
    }

    //Estos dos los agrego para usar en el metodo findOrCreateUser que ahora va a ser parte de services
    async getUserByKeycloakId(keycloakId) {
        const result = await pool.query(
            "SELECT * FROM users WHERE keycloak_id = $1",
            [keycloakId]
        )
        return result.rows[0]
    }

    async getUserByEmail(email) {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        )
        return result.rows[0]
    }
}

module.exports = UserPostgresDAO