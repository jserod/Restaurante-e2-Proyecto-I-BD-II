const jwt = require("jsonwebtoken")
const { createPublicKey } = require("crypto")
const keycloakService = require("../services/keycloakService")

function keycloakProtectFactory() { //Para poder usar protect() en routes
    return async function (req, res, next) {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).send("Access denied")
        }

        const token = authHeader.split(" ")[1]

        try {
            const certs = await keycloakService.getPublicCerts()
            const decoded = jwt.decode(token, { complete: true })

            if (!decoded) return res.status(401).send("Access denied")

            const key = certs.keys.find(k => k.kid === decoded.header.kid)
            if (!key) return res.status(401).send("Access denied")

            const publicKey = createPublicKey({
                key: { kty: key.kty, n: key.n, e: key.e },
                format: "jwk"
            }).export({ type: "spki", format: "pem" })

            const verified = jwt.verify(token, publicKey, { algorithms: ["RS256"] })

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

module.exports = keycloakProtectFactory