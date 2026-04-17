require("dotenv").config()
const app = require("./app")
const pool = require("./config/database")
const initDatabase = require("./database/init")

const PORT = process.env.PORT

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
        await initDatabase()
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    } catch (error) {
        console.error("Failed to start server")
        process.exit(1)
    }
}

connectDB()
startServer()