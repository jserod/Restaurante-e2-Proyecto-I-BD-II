const Keycloak = require("keycloak-connect")
const session = require("express-session")

const memoryStore = new session.MemoryStore()

const keycloak = new Keycloak(
    { store: memoryStore },
    {
        realm: process.env.KEYCLOAK_REALM,
        "auth-server-url": process.env.KEYCLOAK_URL,
        "ssl-required": "none",
        resource: process.env.KEYCLOAK_CLIENT_ID,
        bearerOnly: true,
        credentials: {
            secret: process.env.KEYCLOAK_CLIENT_SECRET
        }
    }
)

const keycloakProtect = require("../middlewares/keycloakProtect")
keycloak.protect = () => keycloakProtect

module.exports = { keycloak, memoryStore }