class ProductDataSource {

    async getProducts() {
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

            const products = []
            for (const menu of raw) {
                const menuId = menu._id.toString()
                const menuName = menu.name
                const restaurantId = menu.restaurant_id?.toString() || ""

                if (menu.products && Array.isArray(menu.products)) {
                    for (const p of menu.products) {
                        products.push({
                            id: p.product_id,
                            name: p.name,
                            description: p.description || "Producto sin descripción",
                            price: p.price,
                            isAvailable: p.is_available,
                            category: menuName.toLowerCase(),
                            menuId: menuId,
                            restaurantId: restaurantId
                        })
                    }
                }
            }

            return products

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
            const result = await pool.query(`
                SELECT p.id, p.name, p.description, p.price, p.is_available,
                       p.menu_id, m.name as menu_name, m.restaurant_id
                FROM products p
                JOIN menus m ON m.id = p.menu_id
            `)

            return result.rows.map(p => ({
                id: p.id.toString(),
                name: p.name,
                description: p.description || "Producto sin descripción",
                price: parseFloat(p.price),
                isAvailable: p.is_available,
                category: p.menu_name.toLowerCase(),
                menuId: p.menu_id.toString(),
                restaurantId: p.restaurant_id.toString()
            }))

        } finally {
            await pool.end()
        }
    }
}

module.exports = new ProductDataSource()