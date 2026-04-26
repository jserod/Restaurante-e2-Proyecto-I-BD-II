require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { ensureIndex } = require("./elastic")
const searchRoutes = require("./searchRoutes")
const swaggerUI = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

const app = express()
const PORT = process.env.SEARCH_PORT || 3001

app.use(cors())
app.use(express.json())

app.get("/openapi.json", (req, res) => {
    res.json(swaggerSpec)
})

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec))

app.get("/health", (req, res) => {
    res.json({ status: "OK", service: "search-service" })
})

app.use("/search", searchRoutes)

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: "Internal server error" })
})

async function start() {
    try {
        await ensureIndex()
        app.listen(PORT, () => {
            console.log(`Search service running on port ${PORT}`)
        })
    } catch (error) {
        console.error("Failed to start search service:", error.message)
        process.exit(1)
    }
}

start()