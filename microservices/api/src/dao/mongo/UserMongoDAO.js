const IUserDAO = require("../interfaces/IUserDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class UserMongoDAO extends IUserDAO {

    async getCollection() {
        const db = await getDb()
        return db.collection("users")
    }

    async getAllUsers() {
        const col = await this.getCollection()
        return await col.find({}, {
            projection: { keycloak_id: 1, email: 1, name: 1, role: 1 }
        }).toArray()
    }

    async getUserById(id) {
        const col = await this.getCollection()
        return await col.findOne({ _id: new ObjectId(id) })
    }

    async getUserByKeycloakId(keycloakId) {
        const col = await this.getCollection()
        return await col.findOne({ keycloak_id: keycloakId })
    }

    async getUserByEmail(email) {
        const col = await this.getCollection()
        return await col.findOne({ email })
    }

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

    async deleteUser(id) {
        const col = await this.getCollection()
        await col.deleteOne({ _id: new ObjectId(id) })
    }
}

module.exports = UserMongoDAO