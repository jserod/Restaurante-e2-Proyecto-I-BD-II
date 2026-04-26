class MenuDataSource {

    async getMenus() {
        const DB_TYPE = process.env.DB_TYPE || "postgres"

        switch (DB_TYPE) {
            case "mongo":
                return await this.getFromMongo()

            case "postgres":
                return await this.getFromPostgres()

            default:
                throw new Error("Unsupported DB_TYPE")
        }
    }

    async getFromMongo() {
        const { MongoClient } = require("mongodb")
        const client = new MongoClient(process.env.MONGO_URI)

        try {
            await client.connect()

            const db = client.db(process.env.MONGO_DB_NAME)
            const raw = await db.collection("menus").find().toArray()

            return raw.map(m => ({
                id: m._id.toString(),
                name: m.name,
                description: m.description || "Producto sin descripción",
                category: (m.category || "general").toLowerCase(),
                price: m.price,
                restaurantId: m.restaurant_id.toString()
            }))

        } finally {
            await client.close()
        }
    }

    async getFromPostgres() {
        const { Pool } = require("pg")

        const pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        })

        try {
            const result = await pool.query("SELECT * FROM menus")

            return result.rows.map(m => ({
                id: m.id.toString(),
                name: m.name,
                description: m.description || "Producto sin descripción",
                category: (m.category || "general").toLowerCase(),
                price: parseFloat(m.price),
                restaurantId: m.restaurant_id.toString()
            }))

        } finally {
            await pool.end()
        }
    }
}

module.exports = new MenuDataSource()