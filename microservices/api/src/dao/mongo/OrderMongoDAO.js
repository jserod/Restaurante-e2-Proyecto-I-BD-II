const IOrderDAO = require("../interfaces/IOrderDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class OrderMongoDAO extends IOrderDAO {

    async getCollection() {
        const db = await getDb()
        return db.collection("orders")
    }

    async getAll() {
        const col = await this.getCollection()
        return await col.find().sort({ _id: 1 }).toArray()
    }

    async getById(id) {
        const col = await this.getCollection()
        return await col.findOne({ _id: new ObjectId(id) })
    }

    async create({ userId, restaurantId, reservationId, pickup, items }) {
        const db = await getDb()
        const col = await this.getCollection()
        const menusCol = db.collection("menus")

        let total = 0
        const enrichedItems = []

        for (const item of items) {
            const menu = await menusCol.findOne({ _id: new ObjectId(item.menuId) })
            if (!menu) throw new Error(`Menu item ${item.menuId} not found`)
            total += menu.price * item.quantity
            enrichedItems.push({
                menu_id: new ObjectId(item.menuId),
                name: menu.name,
                quantity: item.quantity,
                unit_price: menu.price
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

    async update(id, { status }) {
        const col = await this.getCollection()
        return await col.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status } },
            { returnDocument: "after" }
        )
    }

    async delete(id) {
        const col = await this.getCollection()
        await col.deleteOne({ _id: new ObjectId(id) })
    }
}

module.exports = OrderMongoDAO