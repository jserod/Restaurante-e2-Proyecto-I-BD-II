const IReservationDAO = require("../interfaces/IReservationDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class ReservationMongoDAO extends IReservationDAO {

    async getCollection() {
        const db = await getDb()
        return db.collection("reservations")
    }

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