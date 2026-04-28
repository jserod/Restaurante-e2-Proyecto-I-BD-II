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

/* ========================
   OPENAPI SPEC
======================== */
app.get("/search/openapi.json", (req, res) => {
    res.json(swaggerSpec)
})

/* ========================
   SWAGGER UI
======================== */
app.use("/search/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Search Service Docs",
    swaggerOptions: {
        url: "/search/openapi.json"
    }
}))

/* ========================
   DEBUG HOST (para validar balanceo)
======================== */

app.get("/_host", (req, res) => {
    res.json({
        container: require("os").hostname(),
        pid: process.pid,
        service: "search-service"
    })
})

/* ========================
   HEALTH CHECK
======================== */
app.get("/health", (req, res) => {
    res.json({ status: "OK", service: "search-service" })
})

/* ========================
   SEARCH ROUTES
======================== */
app.use("/search", searchRoutes)

/* ========================
   ERROR HANDLER
======================== */
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