/**
 * @fileoverview DAO de productos para MongoDB.
 * Los productos están anidados dentro de menús dentro de restaurantes..
 */

const IProductDAO = require("../interfaces/IProductDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class ProductMongoDAO extends IProductDAO {

    /**
     * Obtiene la colección de productos de MongoDB.
     * @returns {Promise<import("mongodb").Collection>}
     */
    async getCollection() {
        const db = await getDb()
        return db.collection("restaurants")
    }

    /**
     * Obtiene todos los productos de todos los restaurantes, aplanando la estructura anidada.
     * @returns {Promise<Array>} Productos con metadatos de menú y restaurante
     */
    async getAll() {
        const col = await this.getCollection()
        const restaurants = await col.find({ "menus.products": { $exists: true } }, { projection: { menus: 1, name: 1 } }).toArray()
        const products = []
        for (const r of restaurants) {
            if (!r.menus) continue
            for (const menu of r.menus) {
                if (!menu.products) continue
                for (const p of menu.products) {
                    products.push({
                        ...p,
                        menu_id: menu._id.toString(),
                        menu_name: menu.name,
                        restaurant_id: r._id.toString(),
                        restaurant_name: r.name
                    })
                }
            }
        }
        return products
    }

    /**
     * Busca un producto por su ID único.
     * @param {string} id - ID del producto
     * @returns {Promise<Object|null>} Producto con contexto de menú y restaurante
     */
    async getById(id) {
        const col = await this.getCollection()
        const restaurant = await col.findOne(
            { "menus.products.product_id": id },
            { projection: { menus: { $elemMatch: { "products.product_id": id } }, name: 1 } }
        )
        if (!restaurant || !restaurant.menus || restaurant.menus.length === 0) return null

        const menu = restaurant.menus[0]
        const product = menu.products.find(p => p.product_id === id)
        if (!product) return null

        return {
            ...product,
            menu_id: menu._id.toString(),
            menu_name: menu.name,
            restaurant_id: restaurant._id.toString(),
            restaurant_name: restaurant.name
        }
    }

    /**
     * Crea un nuevo producto dentro de un menú existente.
     * @param {Object} data
     * @param {string} data.menuId - ID del menú padre
     * @param {string} data.name - Nombre del producto
     * @param {string} [data.description] - Descripción opcional
     * @param {number} data.price - Precio unitario
     * @param {boolean} [data.isAvailable=true] - Disponibilidad
     * @returns {Promise<Object>} Producto creado
     */
    async create({ menuId, name, description, price, isAvailable }) {
        const col = await this.getCollection()
        const productId = new ObjectId().toString()

        const product = {
            product_id: productId,
            name,
            description: description || null,
            price,
            is_available: isAvailable !== false,
            created_at: new Date()
        }

        await col.updateOne(
            { "menus._id": new ObjectId(menuId) },
            {
                $push: { "menus.$.products": product },
                $set: { updated_at: new Date() }
            }
        )

        return { ...product, menu_id: menuId }
    }

    /**
     * Actualiza campos específicos de un producto existente.
     * @param {string} id - ID del producto
     * @param {Object} data - Campos a actualizar
     * @returns {Promise<Object>} Producto actualizado
     */
    async update(id, data) {
        const col = await this.getCollection()
        const setFields = {}

        if (data.name !== undefined) setFields["menus.$[menu].products.$[product].name"] = data.name
        if (data.description !== undefined) setFields["menus.$[menu].products.$[product].description"] = data.description
        if (data.price !== undefined) setFields["menus.$[menu].products.$[product].price"] = data.price
        if (data.isAvailable !== undefined) setFields["menus.$[menu].products.$[product].is_available"] = data.isAvailable

        if (Object.keys(setFields).length === 0) {
            throw new Error("No fields to update")
        }

        setFields["menus.$[menu].products.$[product].updated_at"] = new Date()
        setFields["updated_at"] = new Date()

        await col.updateOne(
            { "menus.products.product_id": id },
            { $set: setFields },
            {
                arrayFilters: [
                    { "menu.products.product_id": id },
                    { "product.product_id": id }
                ]
            }
        )

        return await this.getById(id)
    }

    /**
     * Elimina un producto de su menú padre.
     * @param {string} id - ID del producto
     * @returns {Promise<void>}
     */
    async delete(id) {
        const col = await this.getCollection()
        await col.updateOne(
            { "menus.products.product_id": id },
            {
                $pull: { "menus.$[menu].products": { product_id: id } },
                $set: { updated_at: new Date() }
            },
            { arrayFilters: [{ "menu.products.product_id": id }] }
        )
    }
}

module.exports = ProductMongoDAO