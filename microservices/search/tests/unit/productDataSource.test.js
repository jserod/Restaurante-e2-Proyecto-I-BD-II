const ProductDataSource = require("../../src/productDataSource")
const { MongoClient } = require("mongodb")
const { Pool } = require("pg")

jest.mock("mongodb")
jest.mock("pg")

describe("ProductDataSource", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        delete process.env.DB_TYPE
    })

    describe("getFromMongo", () => {
        test("extrae productos embebidos de menús", async () => {
            const mockMenus = [
                {
                    _id: { toString: () => "menu123" },
                    name: "Desayunos",
                    restaurant_id: { toString: () => "rest456" },
                    products: [
                        {
                            product_id: "prod1",
                            name: "Café",
                            description: "Café caliente",
                            price: 2.5,
                            is_available: true
                        }
                    ]
                }
            ]

            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    find: jest.fn().mockReturnValue({
                        toArray: jest.fn().mockResolvedValue(mockMenus)
                    })
                })
            }

            const mockClient = {
                connect: jest.fn().mockResolvedValue(),
                db: jest.fn().mockReturnValue(mockDb),
                close: jest.fn().mockResolvedValue()
            }

            MongoClient.mockImplementation(() => mockClient)
            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "prod1",
                name: "Café",
                price: 2.5,
                isAvailable: true,
                category: "desayunos",
                menuId: "menu123",
                restaurantId: "rest456"
            })
        })

        test("delega según DB_TYPE mongo", async () => {
            process.env.DB_TYPE = "mongo"

            const mockMenus = []
            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    find: jest.fn().mockReturnValue({
                        toArray: jest.fn().mockResolvedValue(mockMenus)
                    })
                })
            }
            const mockClient = {
                connect: jest.fn().mockResolvedValue(),
                db: jest.fn().mockReturnValue(mockDb),
                close: jest.fn().mockResolvedValue()
            }

            MongoClient.mockImplementation(() => mockClient)
            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getProducts()

            expect(MongoClient).toHaveBeenCalled()
            expect(result).toEqual([])
        })

        test("maneja menús sin productos", async () => {
            const mockMenus = [
                {
                    _id: { toString: () => "menu123" },
                    name: "Vacío",
                    restaurant_id: { toString: () => "rest456" },
                    products: []
                }
            ]

            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    find: jest.fn().mockReturnValue({
                        toArray: jest.fn().mockResolvedValue(mockMenus)
                    })
                })
            }

            const mockClient = {
                connect: jest.fn().mockResolvedValue(),
                db: jest.fn().mockReturnValue(mockDb),
                close: jest.fn().mockResolvedValue()
            }

            MongoClient.mockImplementation(() => mockClient)
            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(result).toHaveLength(0)
        })

        test("maneja menús sin campo products", async () => {
            const mockMenus = [
                {
                    _id: { toString: () => "menu123" },
                    name: "Sin products",
                    restaurant_id: { toString: () => "rest456" }
                    // No tiene campo products
                }
            ]

            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    find: jest.fn().mockReturnValue({
                        toArray: jest.fn().mockResolvedValue(mockMenus)
                    })
                })
            }

            const mockClient = {
                connect: jest.fn().mockResolvedValue(),
                db: jest.fn().mockReturnValue(mockDb),
                close: jest.fn().mockResolvedValue()
            }

            MongoClient.mockImplementation(() => mockClient)
            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(result).toHaveLength(0)
        })

        test("maneja restaurant_id undefined en Mongo", async () => {
            const mockMenus = [
                {
                    _id: { toString: () => "menu123" },
                    name: "Test",
                    // sin restaurant_id
                    products: [
                        {
                            product_id: "prod1",
                            name: "Item",
                            description: "desc",
                            price: 5.0,
                            is_available: true
                        }
                    ]
                }
            ]

            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    find: jest.fn().mockReturnValue({
                        toArray: jest.fn().mockResolvedValue(mockMenus)
                    })
                })
            }
            const mockClient = {
                connect: jest.fn().mockResolvedValue(),
                db: jest.fn().mockReturnValue(mockDb),
                close: jest.fn().mockResolvedValue()
            }

            MongoClient.mockImplementation(() => mockClient)
            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(result[0].restaurantId).toBe("")
        })

        test("usa descripción por defecto si es null en Mongo", async () => {
            const mockMenus = [
                {
                    _id: { toString: () => "menu123" },
                    name: "Test",
                    restaurant_id: { toString: () => "rest456" },
                    products: [
                        {
                            product_id: "prod1",
                            name: "Item",
                            description: null,
                            price: 5.0,
                            is_available: true
                        }
                    ]
                }
            ]

            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    find: jest.fn().mockReturnValue({
                        toArray: jest.fn().mockResolvedValue(mockMenus)
                    })
                })
            }
            const mockClient = {
                connect: jest.fn().mockResolvedValue(),
                db: jest.fn().mockReturnValue(mockDb),
                close: jest.fn().mockResolvedValue()
            }

            MongoClient.mockImplementation(() => mockClient)
            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(result[0].description).toBe("Producto sin descripción")
        })
    })

    describe("getFromPostgres", () => {
        test("hace JOIN y mapea productos correctamente", async () => {
            const mockRows = [
                {
                    id: 1,
                    name: "Café",
                    description: "Café caliente",
                    price: "2.50",
                    is_available: true,
                    menu_id: 10,
                    menu_name: "Desayunos",
                    restaurant_id: 5
                }
            ]

            const mockPool = {
                query: jest.fn().mockResolvedValue({ rows: mockRows }),
                end: jest.fn().mockResolvedValue()
            }

            Pool.mockImplementation(() => mockPool)
            process.env.DB_HOST = "localhost"
            process.env.DB_PORT = 5432
            process.env.DB_USER = "test"
            process.env.DB_PASSWORD = "test"
            process.env.DB_NAME = "test"

            const result = await ProductDataSource.getFromPostgres()

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "1",
                name: "Café",
                price: 2.5,
                isAvailable: true,
                category: "desayunos",
                menuId: "10",
                restaurantId: "5"
            })
        })

        test("usa descripción por defecto si es null", async () => {
            const mockRows = [
                {
                    id: 1,
                    name: "Té",
                    description: null,
                    price: "2.00",
                    is_available: true,
                    menu_id: 10,
                    menu_name: "Bebidas",
                    restaurant_id: 5
                }
            ]

            const mockPool = {
                query: jest.fn().mockResolvedValue({ rows: mockRows }),
                end: jest.fn().mockResolvedValue()
            }

            Pool.mockImplementation(() => mockPool)
            process.env.DB_HOST = "localhost"
            process.env.DB_PORT = 5432
            process.env.DB_USER = "test"
            process.env.DB_PASSWORD = "test"
            process.env.DB_NAME = "test"

            const result = await ProductDataSource.getFromPostgres()

            expect(result[0].description).toBe("Producto sin descripción")
        })
    })

    describe("getProducts", () => {
        test("delega según DB_TYPE postgres", async () => {
            process.env.DB_TYPE = "postgres"

            const mockPool = {
                query: jest.fn().mockResolvedValue({ rows: [] }),
                end: jest.fn().mockResolvedValue()
            }
            Pool.mockImplementation(() => mockPool)
            process.env.DB_HOST = "localhost"
            process.env.DB_PORT = 5432
            process.env.DB_USER = "test"
            process.env.DB_PASSWORD = "test"
            process.env.DB_NAME = "test"

            const result = await ProductDataSource.getProducts()

            expect(Pool).toHaveBeenCalled()
        })

        test("lanza error si DB_TYPE no es válido", async () => {
            process.env.DB_TYPE = "invalid"

            await expect(ProductDataSource.getProducts()).rejects.toThrow("Unsupported DB_TYPE")
        })

        test("usa postgres por defecto si DB_TYPE no está definido", async () => {
            delete process.env.DB_TYPE

            const mockPool = {
                query: jest.fn().mockResolvedValue({ rows: [] }),
                end: jest.fn().mockResolvedValue()
            }
            Pool.mockImplementation(() => mockPool)

            const result = await ProductDataSource.getProducts()

            expect(Pool).toHaveBeenCalled()
            expect(result).toEqual([])
        })
    })

})