const IMenuDAO = require("../interfaces/IMenuDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class MenuMongoDAO extends IMenuDAO {

    async getCollection() {
        const db = await getDb()
        return db.collection("menus")
    }

    async getAll() {
        const col = await this.getCollection()
        return await col.find().sort({ _id: 1 }).toArray()
    }

    async getById(id) {
        const col = await this.getCollection()
        return await col.findOne({ _id: new ObjectId(id) })
    }

    async getByRestaurant(restaurantId) {
        const col = await this.getCollection()
        return await col.find({
            restaurant_id: new ObjectId(restaurantId)
        }).sort({ _id: 1 }).toArray()
    }

    async create({ restaurantId, name, description, price, category }) {
        const col = await this.getCollection()
        const result = await col.insertOne({
            restaurant_id: new ObjectId(restaurantId),
            name,
            description: description || "Producto sin descripción",
            price,
            category: category || "general",
            created_at: new Date()
        })
        return await col.findOne({ _id: result.insertedId })
    }

    async update(id, { name, description, price, category }) {
        const col = await this.getCollection()
        const update = {}
        if (name) update.name = name
        if (description) update.description = description
        if (price) update.price = price
        if (category) update.category = category

        return await col.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: "after" }
        )
    }

    async delete(id) {
        const col = await this.getCollection()
        await col.deleteOne({ _id: new ObjectId(id) })
    }
}

module.exports = MenuMongoDAO