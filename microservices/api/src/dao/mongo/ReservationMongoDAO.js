/**
 * @fileoverview DAO de reservaciones para MongoDB.
 * Las reservaciones son documentos independientes que referencian a usuarios y restaurantes.
 */

const IReservationDAO = require("../interfaces/IReservationDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class ReservationMongoDAO extends IReservationDAO {

    /**
     * Obtiene la colección de reservaciones de MongoDB.
     * @returns {Promise<import("mongodb").Collection>}
     */
    async getCollection() {
        const db = await getDb()
        return db.collection("reservations")
    }

    /**
     * Obtiene todas las reservaciones con nombres de usuario y restaurante (lookup).
     * @returns {Promise<Array>}
     */
    async getAll() {
        const col = await this.getCollection()
        const db = await getDb()

        return await col.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "guest"
                }
            },
            {
                $lookup: {
                    from: "restaurants",
                    localField: "restaurant_id",
                    foreignField: "_id",
                    as: "restaurant"
                }
            },
            {
                $addFields: {
                    guest: { $arrayElemAt: ["$guest.name", 0] },
                    restaurant: { $arrayElemAt: ["$restaurant.name", 0] }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray()
    }

    /**
     * Busca una reservación por ID con datos enriquecidos de usuario y restaurante.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        const col = await this.getCollection()

        const results = await col.aggregate([
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "guest"
                }
            },
            {
                $lookup: {
                    from: "restaurants",
                    localField: "restaurant_id",
                    foreignField: "_id",
                    as: "restaurant"
                }
            },
            {
                $addFields: {
                    guest: { $arrayElemAt: ["$guest.name", 0] },
                    restaurant: { $arrayElemAt: ["$restaurant.name", 0] }
                }
            }
        ]).toArray()

        return results[0] || null
    }

    /**
     * Crea una nueva reservación con estado "active".
     * @param {Object} data
     * @param {string} data.userId
     * @param {string} data.restaurantId
     * @param {number} data.partySize - Cantidad de comensales
     * @param {string|Date} data.reservationDate - Fecha de la reserva
     * @param {string} [data.notes] - Notas adicionales
     * @returns {Promise<Object>}
     */
    async create({ userId, restaurantId, partySize, reservationDate, notes }) {
        const col = await this.getCollection()
        const result = await col.insertOne({
            user_id: new ObjectId(userId),
            restaurant_id: new ObjectId(restaurantId),
            party_size: partySize,
            reservation_date: new Date(reservationDate),
            status: "active",
            notes: notes || null,
            created_at: new Date()
        })
        return await col.findOne({ _id: result.insertedId })
    }

    /**
     * Actualiza datos de una reservación existente.
     * @param {string} id
     * @param {Object} data
     * @param {number} [data.partySize]
     * @param {string|Date} [data.reservationDate]
     * @param {string} [data.notes]
     * @returns {Promise<Object|null>}
     */
    async update(id, { partySize, reservationDate, notes }) {
        const col = await this.getCollection()
        const update = {}
        if (partySize) update.party_size = partySize
        if (reservationDate) update.reservation_date = new Date(reservationDate)
        if (notes) update.notes = notes

        return await col.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: "after" }
        )
    }

    /**
     * Cancela una reservación cambiando su estado a "cancelled".
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async cancel(id) {
        const col = await this.getCollection()
        return await col.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status: "cancelled" } },
            { returnDocument: "after" }
        )
    }
}

module.exports = ReservationMongoDAO