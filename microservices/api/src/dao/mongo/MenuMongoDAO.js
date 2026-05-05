/**
 * @fileoverview DAO de menús para MongoDB.
 * Los menús están embebidos dentro del documento restaurante como array.
 * Implementa operaciones CRUD sobre menús anidados.
 */

const IMenuDAO = require("../interfaces/IMenuDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class MenuMongoDAO extends IMenuDAO {

    /**
     * Obtiene la colección de menús de MongoDB
     * @returns {Promise<import("mongodb").Collection>} 
     */
    async getCollection() {
        const db = await getDb()
        return db.collection("restaurants")
    }

    /**
     * Obtiene todos los menús de todos los restaurantes, aplanando la estructura.
     * @returns {Promise<Array>} Menús con referencia al restaurante padre
     */
    async getAll() {
        const col = await this.getCollection()
        const restaurants = await col.find({ menus: { $exists: true, $ne: [] } }, { projection: { menus: 1, name: 1 } }).toArray()
        const allMenus = []
        for (const r of restaurants) {
            if (r.menus) {
                for (const m of r.menus) {
                    allMenus.push({
                        ...m,
                        restaurant_id: r._id,
                        restaurant_name: r.name
                    })
                }
            }
        }
        return allMenus
    }

    /**
     * Busca un menú por su ID.
     * @param {string} id - ID del menú
     * @returns {Promise<Object|null>} Menú con referencia al restaurante
     */
    async getById(id) {
        const col = await this.getCollection()
        const restaurant = await col.findOne(
            { "menus._id": new ObjectId(id) },
            { projection: { menus: { $elemMatch: { _id: new ObjectId(id) } }, name: 1 } }
        )
        if (!restaurant || !restaurant.menus || restaurant.menus.length === 0) return null
        return {
            ...restaurant.menus[0],
            restaurant_id: restaurant._id,
            restaurant_name: restaurant.name
        }
    }
    
    /**
     * Obtiene todos los menús de un restaurante específico.
     * @param {string} restaurantId - ID del restaurante
     * @returns {Promise<Array>} Menús del restaurante
     */
    async getByRestaurant(restaurantId) {
        const col = await this.getCollection()
        const restaurant = await col.findOne(
            { _id: new ObjectId(restaurantId) },
            { projection: { menus: 1 } }
        )
        if (!restaurant || !restaurant.menus) return []
        return restaurant.menus.map(m => ({
            ...m,
            restaurant_id: restaurant._id
        }))
    }

    /**
     * Crea un nuevo menú dentro de un restaurante existente.
     * @param {Object} data
     * @param {string} data.restaurantId - ID del restaurante padre
     * @param {string} data.name - Nombre del menú
     * @param {string} [data.description] - Descripción opcional
     * @returns {Promise<Object>} Menú creado
     */
    async create({ restaurantId, name, description }) {
        const col = await this.getCollection()
        const menuId = new ObjectId()
        const menu = {
            _id: menuId,
            name,
            description: description || null,
            products: [],
            created_at: new Date()
        }

        await col.updateOne(
            { _id: new ObjectId(restaurantId) },
            { $push: { menus: menu }, $set: { updated_at: new Date() } }
        )

        return { ...menu, restaurant_id: new ObjectId(restaurantId) }
    }

    /**
     * Actualiza un menú existente.
     * @param {string} id - ID del menú
     * @param {Object} data - Campos a actualizar (name, description)
     * @returns {Promise<Object|null>} Menú actualizado
     */
    async update(id, { name, description }) {
        const col = await this.getCollection()
        const setFields = {}
        if (name !== undefined) setFields["menus.$.name"] = name
        if (description !== undefined) setFields["menus.$.description"] = description
        setFields["menus.$.updated_at"] = new Date()
        setFields["updated_at"] = new Date()

        const result = await col.findOneAndUpdate(
            { "menus._id": new ObjectId(id) },
            { $set: setFields },
            { returnDocument: "after", projection: { menus: { $elemMatch: { _id: new ObjectId(id) } } } }
        )
        if (!result || !result.menus || result.menus.length === 0) return null
        return { ...result.menus[0], restaurant_id: result._id }
    }

    /**
     * Elimina un menú y todos sus productos anidados.
     * @param {string} id - ID del menú
     * @returns {Promise<void>}
     */
    async delete(id) {
        const col = await this.getCollection()
        await col.updateOne(
            { "menus._id": new ObjectId(id) },
            {
                $pull: { menus: { _id: new ObjectId(id) } },
                $set: { updated_at: new Date() }
            }
        )
    }
}

module.exports = MenuMongoDAO