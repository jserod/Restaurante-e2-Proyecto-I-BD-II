require("dotenv").config()

const cors = require("cors")
const express = require("express")
const session = require("express-session")
const { keycloak, memoryStore } = require("./config/keycloak")

const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

const authRoutes = require("./routes/authRoutes")
const usersRoutes = require("./routes/usersRoutes")
const restaurantsRoutes = require("./routes/restaurantsRoutes")
const menusRoutes = require("./routes/menusRoutes")
const reservationsRoutes = require("./routes/reservationsRoutes")
const ordersRoutes = require("./routes/ordersRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use(
    session({
        secret: "super-secret-session",
        resave: false,
        saveUninitialized: true,
        store: memoryStore
    })
)

app.use(keycloak.middleware())

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Restaurant API running" })
})

app.get("/", (req, res) => {
    res.json({ message: "API funcionando correctamente" })
})

app.use("/auth", authRoutes)
app.use("/users", usersRoutes)
app.use("/restaurants", restaurantsRoutes)
app.use("/menus", menusRoutes)
app.use("/reservations", reservationsRoutes)
app.use("/orders", ordersRoutes)

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" })
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: "Internal server error" })
})

module.exports = app