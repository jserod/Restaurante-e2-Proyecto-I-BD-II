require("dotenv").config()
const app = require("./app")
const initDatabase = require("./database/init")

const PORT = process.env.PORT
const DB_TYPE = process.env.DB_TYPE || "postgres"

console.log("DB_TYPE:", process.env.DB_TYPE)

async function connectDB() {
    try {
        const res = await pool.query("SELECT NOW()")
        console.log("Database connected:", res.rows[0])
    } catch (err) {
        console.error("DB connection error:", err.message)
    }
}

async function startServer() {
    try {
        if (DB_TYPE === "postgres") {
            const pool = require("./config/database")
            const res = await pool.query("SELECT NOW()")
            console.log("PostgreSQL connected:", res.rows[0])
        } else if (DB_TYPE === "mongo") {
            const getDb = require("./config/database")
            await getDb()
            console.log("MongoDB connected")
        }

        await initDatabase()

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} using ${DB_TYPE}`)
        })
    } catch (error) {
        console.error("Failed to start server:", error.message)
        process.exit(1)
    }
}

connectDB()
startServer()