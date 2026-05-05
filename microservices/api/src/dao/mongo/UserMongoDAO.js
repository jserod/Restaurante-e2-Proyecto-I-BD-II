/**
 * @fileoverview DAO de usuarios para MongoDB.
 * Los usuarios se sincronizan con Keycloak (keycloak_id como identificador externo).
 * CRUD simple sobre colección de usuarios locales.
 */

const IUserDAO = require("../interfaces/IUserDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class UserMongoDAO extends IUserDAO {

    /**
     * Obtiene la colección de usuarios de MongoDB.
     * @returns {Promise<import("mongodb").Collection>}
     */
    async getCollection() {
        const db = await getDb()
        return db.collection("users")
    }

    /**
     * Obtiene todos los usuarios con campos esenciales.
     * @returns {Promise<Array>}
     */
    async getAllUsers() {
        const col = await this.getCollection()
        return await col.find({}, {
            projection: { keycloak_id: 1, email: 1, name: 1, role: 1 }
        }).toArray()
    }

    /**
     * Busca un usuario por su ID interno de MongoDB.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getUserById(id) {
        const col = await this.getCollection()
        return await col.findOne({ _id: new ObjectId(id) })
    }

    /**
     * Busca un usuario por su ID de Keycloak.
     * @param {string} keycloakId
     * @returns {Promise<Object|null>}
     */
    async getUserByKeycloakId(keycloakId) {
        const col = await this.getCollection()
        return await col.findOne({ keycloak_id: keycloakId })
    }

    /**
     * Busca un usuario por email.
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    async getUserByEmail(email) {
        const col = await this.getCollection()
        return await col.findOne({ email })
    }

    /**
     * Crea un nuevo usuario local vinculado a Keycloak.
     * @param {Object} data
     * @param {string} data.keycloakId
     * @param {string} data.email
     * @param {string} data.name
     * @param {string} [data.role="client"]
     * @returns {Promise<Object>}
     */
    async createUser({ keycloakId, email, name, role }) {
        const col = await this.getCollection()
        const result = await col.insertOne({
            keycloak_id: keycloakId,
            email,
            name,
            role: role || "client",
            created_at: new Date()
        })
        return await col.findOne({ _id: result.insertedId })
    }

    /**
     * Actualiza datos de un usuario por su keycloak_id.
     * @param {string} keycloakId
     * @param {Object} data
     * @param {string} [data.name]
     * @param {string} [data.email]
     * @returns {Promise<Object|null>}
     */
    async updateUser(keycloakId, { name, email }) {
        const col = await this.getCollection()
        const update = {}
        if (name) update.name = name
        if (email) update.email = email

        return await col.findOneAndUpdate(
            { keycloak_id: keycloakId },
            { $set: update },
            { returnDocument: "after" }
        )
    }

    /**
     * Elimina un usuario por su ID interno.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteUser(id) {
        const col = await this.getCollection()
        await col.deleteOne({ _id: new ObjectId(id) })
    }
}

module.exports = UserMongoDAO