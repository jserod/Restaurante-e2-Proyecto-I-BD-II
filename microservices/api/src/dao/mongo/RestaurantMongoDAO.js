/**
 * @fileoverview DAO de restaurantes para MongoDB.
 * Los restaurantes son documentos independientes que contienen menús embebidos.
 * CRUD simple sobre colección de restaurantes.
 */

const IRestaurantDAO = require("../interfaces/IRestaurantDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class RestaurantMongoDAO extends IRestaurantDAO {

    /**
     * Obtiene la colección de restaurantes de MongoDB.
     * @returns {Promise<import("mongodb").Collection>}
     */
    async getCollection() {
        const db = await getDb()
        return db.collection("restaurants")
    }

    /**
     * Obtiene todos los restaurantes ordenados por ID.
     * @returns {Promise<Array>}
     */
    async getAll() {
        const col = await this.getCollection()
        return await col.find().sort({ _id: 1 }).toArray()
    }

    /**
     * Busca un restaurante por su ID.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        const col = await this.getCollection()
        return await col.findOne({ _id: new ObjectId(id) })
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
        const col = await this.getCollection()
        const result = await col.insertOne({
            name,
            description,
            address,
            created_at: new Date()
        })
        return await col.findOne({ _id: result.insertedId })
    }

     /**
     * Actualiza un restaurante existente.
     * @param {string} id
     * @param {Object} data - Campos a actualizar
     * @returns {Promise<Object|null>}
     */
    async update(id, { name, description, address }) {
        const col = await this.getCollection()
        const update = {}
        if (name) update.name = name
        if (description) update.description = description
        if (address) update.address = address

        return await col.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: "after" }
        )
    }

    /**
     * Elimina un restaurante por su ID.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(id) {
        const col = await this.getCollection()
        await col.deleteOne({ _id: new ObjectId(id) })
    }
}

module.exports = RestaurantMongoDAO