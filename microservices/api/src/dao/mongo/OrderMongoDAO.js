/**
 * @fileoverview DAO de órdenes para MongoDB.
 * Las órdenes son documentos independientes que referencian a usuarios, restaurantes y reservas.
 * Valida existencia de productos durante la creación.
 */

const IOrderDAO = require("../interfaces/IOrderDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class OrderMongoDAO extends IOrderDAO {

    /**
     * Obtiene la colección de ordenes de MongoDB
     * @returns {Promise<import("mongodb").Collection>} 
     */
    async getCollection() {
        const db = await getDb()
        return db.collection("orders")
    }

    /**
     * Obtiene todas las órdenes ordenadas por ID.
     * @returns {Promise<Array>}
     */
    async getAll() {
        const col = await this.getCollection()
        return await col.find().sort({ _id: 1 }).toArray()
    }

    /**
     * Busca una orden por su ID.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        const col = await this.getCollection()
        return await col.findOne({ _id: new ObjectId(id) })
    }

     /**
     * Crea una orden validando existencia de cada producto en el restaurante.
     * Calcula el total sumando precio * cantidad de cada ítem.
     * @param {Object} data
     * @param {string} data.userId - ID del usuario
     * @param {string} data.restaurantId - ID del restaurante
     * @param {string} [data.reservationId] - ID de reserva asociada
     * @param {boolean} [data.pickup=false] - Indica si es para llevar
     * @param {Array<{menuId, productId, quantity}>} data.items - Ítems de la orden
     * @returns {Promise<Object>} Orden creada con items enriquecidos
     */
    async create({ userId, restaurantId, reservationId, pickup, items }) {
        const db = await getDb()
        const col = await this.getCollection()
        const restaurantsCol = db.collection("restaurants")

        let total = 0
        const enrichedItems = []

        for (const item of items) {
            const restaurant = await restaurantsCol.findOne(
                {
                    _id: new ObjectId(restaurantId),
                    "menus._id": new ObjectId(item.menuId),
                    "menus.products.product_id": item.productId
                },
                { projection: { "menus.$": 1 } }
            )

            if (!restaurant || !restaurant.menus || restaurant.menus.length === 0) {
                throw new Error(`Menu ${item.menuId} not found in restaurant ${restaurantId}`)
            }

            const menu = restaurant.menus[0]
            const product = menu.products.find(p => p.product_id === item.productId)

            if (!product) {
                throw new Error(`Product ${item.productId} not found in menu ${item.menuId}`)
            }

            total += product.price * item.quantity

            enrichedItems.push({
                menu_id: new ObjectId(item.menuId),
                product_id: item.productId,
                name: product.name,
                quantity: item.quantity,
                unit_price: product.price
            })
        }

        const result = await col.insertOne({
            user_id: new ObjectId(userId),
            restaurant_id: new ObjectId(restaurantId),
            reservation_id: reservationId ? new ObjectId(reservationId) : null,
            pickup: pickup || false,
            status: "pending",
            total,
            items: enrichedItems,
            created_at: new Date()
        })

        return await col.findOne({ _id: result.insertedId })
    }

    /**
     * Actualiza el estado de una orden.
     * @param {string} id
     * @param {Object} data
     * @param {string} data.status - Nuevo estado
     * @returns {Promise<Object|null>}
     */
    async update(id, { status }) {
        const col = await this.getCollection()
        return await col.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status } },
            { returnDocument: "after" }
        )
    }

    /**
     * Elimina una orden por su ID.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(id) {
        const col = await this.getCollection()
        await col.deleteOne({ _id: new ObjectId(id) })
    }
}

module.exports = OrderMongoDAO