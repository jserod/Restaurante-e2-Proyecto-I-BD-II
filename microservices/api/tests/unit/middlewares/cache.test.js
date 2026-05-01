const { cache, invalidateCache, invalidateOnSuccess } = require("../../../src/middlewares/cache")
const { client, connectRedis } = require("../../../src/config/redis")

jest.mock("../../../src/config/redis", () => ({
    connectRedis: jest.fn(),
    client: {
        get: jest.fn(),
        setEx: jest.fn().mockResolvedValue(undefined),
        keys: jest.fn(),
        del: jest.fn()
    }
}))

describe("Cache Middleware", () => {
    let req, res, next

    beforeEach(() => {
        req = { method: "GET", originalUrl: "/test" }
        res = {
            json: jest.fn().mockReturnThis(),
            statusCode: 200
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe("cache", () => {
        test("no cachea si no es GET", async () => {
            req.method = "POST"
            const middleware = cache(60)
            await middleware(req, res, next)

            expect(next).toHaveBeenCalled()
            expect(connectRedis).not.toHaveBeenCalled()
        })

        test("retorna cache si existe", async () => {
            const cachedData = { data: "cached" }
            client.get.mockResolvedValue(JSON.stringify(cachedData))

            const middleware = cache(60)
            await middleware(req, res, next)

            expect(client.get).toHaveBeenCalledWith("cache:GET:/test")
            expect(res.json).toHaveBeenCalledWith(cachedData)
            expect(next).not.toHaveBeenCalled()
        })

        test("continua si no hay cache y guarda respuesta", async () => {
            client.get.mockResolvedValue(null)

            const middleware = cache(60)
            await middleware(req, res, next)

            expect(next).toHaveBeenCalled()

            // Simular respuesta - ahora setEx retorna Promise
            const responseData = { data: "fresh" }
            res.json(responseData)

            expect(client.setEx).toHaveBeenCalledWith(
                "cache:GET:/test",
                60,
                JSON.stringify(responseData)
            )
        })

        test("maneja error de Redis gracefully", async () => {
            client.get.mockRejectedValue(new Error("Redis down"))

            const middleware = cache(60)
            await middleware(req, res, next)

            expect(next).toHaveBeenCalled()
        })

        test("maneja error al guardar en cache", async () => {
            client.get.mockResolvedValue(null)
            client.setEx.mockRejectedValue(new Error("Redis write fail"))

            const middleware = cache(60)
            await middleware(req, res, next)

            expect(next).toHaveBeenCalled()

            // No debería lanzar error, solo loguearlo
            const responseData = { data: "test" }
            expect(() => res.json(responseData)).not.toThrow()
        })

        test("usa TTL por defecto de 60 segundos", async () => {
            client.get.mockResolvedValue(null)

            const middleware = cache() // sin argumentos
            await middleware(req, res, next)

            expect(next).toHaveBeenCalled()

            res.json({ data: "test" })

            expect(client.setEx).toHaveBeenCalledWith(
                "cache:GET:/test",
                60,
                expect.any(String)
            )
        })
    })

    describe("invalidateCache", () => {
        test("elimina claves por patrón", async () => {
            client.keys.mockResolvedValue(["key1", "key2"])

            await invalidateCache("cache:GET:/test*")

            expect(client.keys).toHaveBeenCalledWith("cache:GET:/test*")
            expect(client.del).toHaveBeenCalledWith(["key1", "key2"])
        })

        test("no falla si no hay claves", async () => {
            client.keys.mockResolvedValue([])

            await invalidateCache("pattern")

            expect(client.del).not.toHaveBeenCalled()
        })

        test("logea error si falla invalidateCache", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation()

            client.keys.mockRejectedValue(new Error("Redis fail"))

            await invalidateCache("pattern")

            expect(consoleSpy).toHaveBeenCalledWith(
                "Cache invalidate error:",
                expect.any(Error)
            )

            consoleSpy.mockRestore()
        })
    })

    describe("invalidateOnSuccess", () => {
        test("invalida cache en respuesta exitosa", async () => {
            client.keys.mockResolvedValue(["key1"])

            const middleware = invalidateOnSuccess("cache:GET:/products*")
            await middleware(req, res, next)

            expect(next).toHaveBeenCalled()

            // Simular respuesta exitosa
            res.json({ success: true })

            // Esperar a que la promesa de invalidateCache se resuelva
            await new Promise(resolve => setImmediate(resolve))

            expect(client.keys).toHaveBeenCalledWith("cache:GET:/products*")
            expect(client.del).toHaveBeenCalled()
        })

        test("no invalida si hay error", async () => {
            res.statusCode = 500
            const middleware = invalidateOnSuccess("pattern")
            await middleware(req, res, next)

            res.json({ error: "fail" })

            expect(client.keys).not.toHaveBeenCalled()
        })
    })
})