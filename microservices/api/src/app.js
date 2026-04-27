require("dotenv").config()

const express = require("express")
const cors = require("cors")
const session = require("express-session")

const { keycloak, memoryStore } = require("./config/keycloak")
const { AppError } = require("./errors")

const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

// routes
const authRoutes = require("./routes/authRoutes")
const usersRoutes = require("./routes/usersRoutes")
const restaurantsRoutes = require("./routes/restaurantsRoutes")
const menusRoutes = require("./routes/menusRoutes")
const reservationsRoutes = require("./routes/reservationsRoutes")
const ordersRoutes = require("./routes/ordersRoutes")

const app = express()

/* ========================
   GLOBAL MIDDLEWARES
======================== */

app.use(cors())
app.use(express.json())

/* ========================
   SESSION 
======================== */

app.use(
    session({
        secret: process.env.SESSION_SECRET || "dev-secret",
        resave: false,
        saveUninitialized: false,
        store: memoryStore
    })
)

/* ========================
   DOCUMENTATION (ANTES de Keycloak)
======================== */

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Restaurant API Docs"
}))

app.get("/api/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.json(swaggerSpec)
})

/* ========================
   HEALTH CHECK (ANTES de Keycloak)
======================== */

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "restaurant-api"
    })
})

/* ========================
   AUTH  
======================== */
app.use("/auth", authRoutes)

/* ========================
   AUTH (Keycloak) - DESPUÉS de rutas públicas
======================== */

app.use(keycloak.middleware())

/* ========================
   ROUTES (PROTEGIDAS por Keycloak)
======================== */

app.use("/users", usersRoutes)
app.use("/restaurants", restaurantsRoutes)
app.use("/menus", menusRoutes)
app.use("/reservations", reservationsRoutes)
app.use("/orders", ordersRoutes)

/* ========================
   GLOBAL ERROR HANDLER
======================== */

app.use((err, req, res, next) => {
    console.error(err)

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message })
    }

    res.status(500).json({ error: "Internal server error" })
})

module.exports = app