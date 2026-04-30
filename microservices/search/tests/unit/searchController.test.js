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

const { searchByText, searchByCategory, reindex } = require("../../src/searchController")
const { client: esClient } = require("../../src/config/elastic")
const productDataSource = require("../../src/productDataSource")

describe("Search Controller", () => {
    let req, res, next

    beforeEach(() => {
        req = { query: {}, params: {} }
        res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe("searchByText", () => {
        test("error 400 si falta query", async () => {
            await searchByText(req, res, next)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "Query parameter 'q' is required" })
        })

        test("retorna resultados de ES", async () => {
            req.query = { q: "cafe" }
            esClient.search.mockResolvedValue({
                hits: { hits: [{ _source: { id: "1", name: "Café" } }] }
            })

            await searchByText(req, res, next)

            expect(esClient.search).toHaveBeenCalledWith(expect.objectContaining({
                query: expect.objectContaining({
                    multi_match: expect.any(Object)
                })
            }))
            expect(res.json).toHaveBeenCalledWith([{ id: "1", name: "Café" }])
        })

        test("llama next con error si falla ES", async () => {
            req.query = { q: "cafe" }
            const error = new Error("ES down")
            esClient.search.mockRejectedValue(error)

            await searchByText(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("searchByCategory", () => {
        test("busca por categoría en minúsculas", async () => {
            req.params = { categoria: "Desayunos" }
            esClient.search.mockResolvedValue({
                hits: { hits: [{ _source: { id: "1", category: "desayunos" } }] }
            })

            await searchByCategory(req, res, next)

            expect(esClient.search).toHaveBeenCalledWith(expect.objectContaining({
                query: { term: { category: "desayunos" } }
            }))
            expect(res.json).toHaveBeenCalledWith([{ id: "1", category: "desayunos" }])
        })

        test("llama next con error si falla", async () => {
            req.params = { categoria: "test" }
            const error = new Error("ES fail")
            esClient.search.mockRejectedValue(error)

            await searchByCategory(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("reindex", () => {
        test("reindexa productos correctamente", async () => {
            const products = [{ id: "1", name: "Café" }]
            productDataSource.getProducts.mockResolvedValue(products)
            esClient.bulk.mockResolvedValue({ errors: false })

            await reindex(req, res, next)

            expect(productDataSource.getProducts).toHaveBeenCalled()
            expect(esClient.bulk).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith({
                message: "Reindex completed",
                indexed: 1,
                errors: false
            })
        })

        test("maneja lista vacía", async () => {
            productDataSource.getProducts.mockResolvedValue([])

            await reindex(req, res, next)

            expect(res.json).toHaveBeenCalledWith({
                message: "No products to index",
                indexed: 0
            })
            expect(esClient.bulk).not.toHaveBeenCalled()
        })

        test("llama next con error si falla", async () => {
            const error = new Error("DB fail")
            productDataSource.getProducts.mockRejectedValue(error)

            await reindex(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})