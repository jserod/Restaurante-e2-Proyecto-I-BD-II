/**
 * @fileoverview Middleware de caching con Redis.
 * Proporciona cacheo de respuestas GET, invalidación por patrón e invalidación automática tras cambios.
 */

const { client, connectRedis } = require("../config/redis")

/**
 * Cachea respuestas GET en Redis con TTL configurable.
 * Intercepta res.json para almacenar el resultado antes de enviarlo.
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

            // Interceptar res.json para guardar en caché
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
 * @param {string} pattern - Patrón de claves, ej: "cache:GET:/products*"
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
 * Middleware que invalida caché automáticamente tras una respuesta exitosa (status < 400).
 * Útil para operaciones POST/PUT/DELETE que modifican recursos cacheados.
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