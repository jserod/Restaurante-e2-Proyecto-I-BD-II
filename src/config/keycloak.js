const Keycloak = require("keycloak-connect")
const session = require("express-session")
const jwt = require("jsonwebtoken")
const https = require("https")
const http = require("http")

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

// middleware manual que reemplaza keycloak.protect()
function protect() {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).send("Access denied")
        }

        const token = authHeader.split(" ")[1]

        try {
            // obtener la clave publica de keycloak
            const certsUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`

            const certs = await fetchJson(certsUrl)
            const decoded = jwt.decode(token, { complete: true })

            if (!decoded) return res.status(401).send("Access denied")

            const kid = decoded.header.kid
            const key = certs.keys.find(k => k.kid === kid)

            if (!key) return res.status(401).send("Access denied")

            const publicKey = jwkToPem(key)
            const verified = jwt.verify(token, publicKey, { algorithms: ["RS256"] })

            // inyectar en kauth para compatibilidad con middlewares existentes
            req.kauth = {
                grant: {
                    access_token: {
                        token,
                        content: verified
                    }
                }
            }

            next()
        } catch (err) {
            console.error("Token validation error:", err.message)
            return res.status(401).send("Access denied")
        }
    }
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http
        client.get(url, res => {
            let data = ""
            res.on("data", chunk => data += chunk)
            res.on("end", () => resolve(JSON.parse(data)))
        }).on("error", reject)
    })
}

function jwkToPem(jwk) {
    // convertir modulus y exponent a PEM manualmente
    const n = Buffer.from(jwk.n, "base64")
    const e = Buffer.from(jwk.e, "base64")
    
    // usar crypto de node para construir la llave
    const { createPublicKey } = require("crypto")
    const keyObject = createPublicKey({
        key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
        format: "jwk"
    })
    return keyObject.export({ type: "spki", format: "pem" })
}

// sobrescribir keycloak.protect con nuestra version
keycloak.protect = protect

module.exports = { keycloak, memoryStore }