/**
 * @fileoverview Middleware de caching con Redis para el microservicio de búsqueda.
 * Replica la funcionalidad del API principal para consistencia entre servicios.
 */

const { client, connectRedis } = require("../config/redis")

/**
 * Cachea respuestas GET en Redis con TTL configurable.
 * @param {number} [ttlSeconds=60] - Tiempo de vida en segundos
 * @returns {Function} Middleware de Express
 */
function cache(ttlSeconds = 60) {
    return async (req, res, next) => {
        // Solo cachear GET
        if (req.method !== "GET") {
            return next()
        }

        const key = `cache:${req.method}:${req.originalUrl}`

        try {
            await connectRedis()
            const cached = await client.get(key)

            if (cached) {
                console.log(`[CACHE HIT] ${key}`)
                return res.json(JSON.parse(cached))
            }

            const originalJson = res.json.bind(res)
            res.json = (data) => {
                client.setEx(key, ttlSeconds, JSON.stringify(data))
                    .catch(err => console.error("Redis set error:", err))
                return originalJson(data)
            }

            console.log(`[CACHE MISS] ${key}`)
            next()

        } catch (error) {
            console.error("Cache middleware error:", error)
            next()
        }
    }
}

/**
 * Elimina claves de caché que coincidan con un patrón.
 * @param {string} pattern - Patrón de claves a borrar
 * @returns {Promise<void>}
 */
async function invalidateCache(pattern) {
    try {
        await connectRedis()
        const keys = await client.keys(pattern)
        if (keys.length > 0) {
            await client.del(keys)
            console.log(`[CACHE INVALIDATE] ${keys.length} keys: ${pattern}`)
        }
    } catch (error) {
        console.error("Cache invalidate error:", error)
    }
}

/**
 * Invalida caché automáticamente tras respuesta exitosa.
 * @param {string} pattern - Patrón de claves a invalidar
 * @returns {Function} Middleware de Express
 */
function invalidateOnSuccess(pattern) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res)
        res.json = async (data) => {
            if (res.statusCode < 400) {
                await invalidateCache(pattern)
            }
            return originalJson(data)
        }
        next()
    }
}

module.exports = { 
    cache, 
    invalidateCache, 
    invalidateOnSuccess 
}