const IRestaurantDAO = require("../interfaces/IRestaurantDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class RestaurantMongoDAO extends IRestaurantDAO {

    async getCollection() {
        const db = await getDb()
        return db.collection("restaurants")
    }

    async getAll() {
        const col = await this.getCollection()
        return await col.find().sort({ _id: 1 }).toArray()
    }

    async getById(id) {
        const col = await this.getCollection()
        return await col.findOne({ _id: new ObjectId(id) })
    }

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

    async delete(id) {
        const col = await this.getCollection()
        await col.deleteOne({ _id: new ObjectId(id) })
    }
}

module.exports = RestaurantMongoDAO