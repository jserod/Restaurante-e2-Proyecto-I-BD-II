const request = require("supertest")
const express = require("express")

jest.mock("../../src/config/elastic", () => {
    const { createMockElasticModule } = require("../helpers/mockElastic")
    return createMockElasticModule()
})

jest.mock("../../src/config/redis", () => {
    const { createMockRedisModule } = require("../helpers/mockRedis")
    return createMockRedisModule()
})

jest.mock("../../src/productDataSource", () => ({
    getProducts: jest.fn()
}))

const { client: esClient } = require("../../src/config/elastic")
const { client: redisClient } = require("../../src/config/redis")
const productDataSource = require("../../src/productDataSource")

const searchRoutes = require("../../src/searchRoutes")

const app = express()
app.use(express.json())

app.get("/search/health", (req, res) => {
    res.json({ status: "OK", service: "search-service" })
})

app.use("/search", searchRoutes)

describe("Search Routes - Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("GET /search/health retorna 200", async () => {
        const res = await request(app).get("/search/health")
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ status: "OK", service: "search-service" })
    })

    test("GET /search/products?q=cafe busca en ES", async () => {
        redisClient.get.mockResolvedValue(null)
        esClient.search.mockResolvedValue({
            hits: { hits: [{ _source: { id: "1", name: "Café con leche" } }] }
        })

        const res = await request(app).get("/search/products?q=cafe")

        expect(res.status).toBe(200)
        expect(res.body).toEqual([{ id: "1", name: "Café con leche" }])
    })

    test("GET /search/products?q=cafe usa cache si existe", async () => {
        const cached = [{ id: "1", name: "Café" }]
        redisClient.get.mockResolvedValue(JSON.stringify(cached))

        const res = await request(app).get("/search/products?q=cafe")

        expect(res.status).toBe(200)
        expect(res.body).toEqual(cached)
        expect(esClient.search).not.toHaveBeenCalled()
    })

    test("GET /search/products/category/desayunos filtra por categoría", async () => {
        redisClient.get.mockResolvedValue(null)
        esClient.search.mockResolvedValue({
            hits: { hits: [{ _source: { id: "1", name: "Café", category: "desayunos" } }] }
        })

        const res = await request(app).get("/search/products/category/desayunos")

        expect(res.status).toBe(200)
        expect(res.body[0].category).toBe("desayunos")
    })

    test("POST /search/reindex reindexa productos", async () => {
        productDataSource.getProducts.mockResolvedValue([{ id: "1", name: "Café" }])
        esClient.bulk.mockResolvedValue({ errors: false })

        const res = await request(app).post("/search/reindex")

        expect(res.status).toBe(200)
        expect(res.body.message).toBe("Reindex completed")
    })
})