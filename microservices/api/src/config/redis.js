/**
 * @fileoverview Cliente Redis singleton. Expone conexión lazy y manejador de errores.
 */

const { createClient } = require("redis")

const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
})

client.on("error", (err) => console.error("Redis Client Error:", err))

/**
 * Establece la conexión con Redis si no está abierta.
 * Múltiples llamadas no crean conexiones duplicadas.
 * @async
 * @returns {Promise<void>}
 */
async function connectRedis() {
    if (!client.isOpen) {
        await client.connect()
        console.log("Redis connected (API)")
    }
}

module.exports = { client, connectRedis }