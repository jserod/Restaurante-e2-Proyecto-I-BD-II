const { client, connectRedis } = require("../config/redis")

/**
 * Middleware que cachea respuestas GET en Redis
 * @param {number} ttlSeconds - Tiempo de vida en segundos
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
 * Invalida claves de caché por patrón
 * @param {string} pattern - Patrón de claves a borrar, ej: "cache:GET:/products*"
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
 * Si hubo respuesta exitosa, llama invalidar claves de caché por patrón
 * @param {string} pattern - Patrón de claves a borrar, ej: "cache:GET:/products*"
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