const ProductDataSource = require("../../src/productDataSource")


jest.mock("mongodb", () => ({
    MongoClient: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(),
        db: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
                find: jest.fn().mockReturnValue({
                    toArray: jest.fn()
                })
            })
        }),
        close: jest.fn().mockResolvedValue()
    }))
}))

jest.mock("pg", () => ({
    Pool: jest.fn().mockImplementation(() => ({
        query: jest.fn(),
        end: jest.fn().mockResolvedValue()
    }))
}))

const { MongoClient } = require("mongodb")
const { Pool } = require("pg")

describe("ProductDataSource", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        delete process.env.DB_TYPE
    })

    describe("getFromMongo", () => {
        test("extrae productos embebidos de restaurants.menus.products", async () => {
            const mockRestaurants = [
                {
                    _id: { toString: () => "rest456" },
                    name: "Soda Típica",
                    menus: [
                        {
                            _id: { toString: () => "menu123" },
                            name: "Desayunos",
                            products: [
                                {
                                    product_id: "prod1",
                                    name: "Café",
                                    description: "Café caliente",
                                    price: 2500,
                                    is_available: true
                                }
                            ]
                        }
                    ]
                }
            ]

            const mockToArray = jest.fn().mockResolvedValue(mockRestaurants)
            const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
            const mockCollection = jest.fn().mockReturnValue({ find: mockFind })
            const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })
            
            MongoClient.mockImplementation(() => ({
                connect: jest.fn().mockResolvedValue(),
                db: mockDb,
                close: jest.fn().mockResolvedValue()
            }))

            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(mockCollection).toHaveBeenCalledWith("restaurants")
            expect(mockFind).toHaveBeenCalledWith(
                { "menus.products": { $exists: true } },
                { projection: { menus: 1, name: 1 } }
            )
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "prod1",
                name: "Café",
                price: 2500,
                isAvailable: true,
                category: "desayunos",
                menuId: "menu123",
                restaurantId: "rest456",
                restaurantName: "Soda Típica"
            })
        })

        test("maneja restaurantes sin menus", async () => {
            const mockRestaurants = [
                {
                    _id: { toString: () => "rest789" },
                    name: "Resto Sin Menus"
                }
            ]

            const mockToArray = jest.fn().mockResolvedValue(mockRestaurants)
            const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
            const mockCollection = jest.fn().mockReturnValue({ find: mockFind })
            const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })

            MongoClient.mockImplementation(() => ({
                connect: jest.fn().mockResolvedValue(),
                db: mockDb,
                close: jest.fn().mockResolvedValue()
            }))

            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(result).toHaveLength(0)
        })

        test("maneja menús sin campo products", async () => {
            const mockRestaurants = [
                {
                    _id: { toString: () => "rest456" },
                    name: "Test",
                    menus: [
                        {
                            _id: { toString: () => "menu123" },
                            name: "Sin products"
                        }
                    ]
                }
            ]

            const mockToArray = jest.fn().mockResolvedValue(mockRestaurants)
            const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
            const mockCollection = jest.fn().mockReturnValue({ find: mockFind })
            const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })

            MongoClient.mockImplementation(() => ({
                connect: jest.fn().mockResolvedValue(),
                db: mockDb,
                close: jest.fn().mockResolvedValue()
            }))

            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getFromMongo()

            expect(result).toHaveLength(0)
        })

        test("usa descripción por defecto si es null", async () => {
            const mockRestaurants = [
                {
                    _id: { toString: () => "rest456" },
                    name: "Test",
                    menus: [
                        {
                            _id: { toString: () => "menu123" },
                            name: "Test",
                            products: [
                                {
                                    product_id: "prod1",
                                    name: "Item",
                                    description: null,
                                    price: 5000,
                                    is_available: true
                                }
                            ]
                        }
                    ]
                }
            ]

            const mockToArray = jest.fn().mockResolvedValue(mockRestaurants)
            const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
            const mockCollection = jest.fn().mockReturnValue({ find: mockFind })
            const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })

            MongoClient.mockImplementation(() => ({
                connect: jest.fn().mockResolvedValue(),
                db: mockDb,
                close: jest.fn().mockResolvedValue()
            }))

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
                    price: "2500",
                    is_available: true,
                    menu_id: 10,
                    menu_name: "Desayunos",
                    restaurant_id: 5
                }
            ]

            const mockQuery = jest.fn().mockResolvedValue({ rows: mockRows })
            const mockEnd = jest.fn().mockResolvedValue()

            Pool.mockImplementation(() => ({
                query: mockQuery,
                end: mockEnd
            }))

            process.env.DB_HOST = "localhost"
            process.env.DB_PORT = 5432
            process.env.DB_USER = "test"
            process.env.DB_PASSWORD = "test"
            process.env.DB_NAME = "test"

            const result = await ProductDataSource.getFromPostgres()

            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("FROM products p"))
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "1",
                name: "Café",
                price: 2500,
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
                    price: "2000",
                    is_available: true,
                    menu_id: 10,
                    menu_name: "Bebidas",
                    restaurant_id: 5
                }
            ]

            Pool.mockImplementation(() => ({
                query: jest.fn().mockResolvedValue({ rows: mockRows }),
                end: jest.fn().mockResolvedValue()
            }))

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
        test("delega a getFromMongo cuando DB_TYPE=mongo", async () => {
            process.env.DB_TYPE = "mongo"

            const mockRestaurants = []
            const mockToArray = jest.fn().mockResolvedValue(mockRestaurants)
            const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
            const mockCollection = jest.fn().mockReturnValue({ find: mockFind })
            const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })

            MongoClient.mockImplementation(() => ({
                connect: jest.fn().mockResolvedValue(),
                db: mockDb,
                close: jest.fn().mockResolvedValue()
            }))

            process.env.MONGO_URI = "mongodb://localhost:27017"
            process.env.MONGO_DB_NAME = "test"

            const result = await ProductDataSource.getProducts()

            expect(MongoClient).toHaveBeenCalled()
            expect(result).toEqual([])
        })

        test("delega a getFromPostgres cuando DB_TYPE=postgres", async () => {
            process.env.DB_TYPE = "postgres"

            Pool.mockImplementation(() => ({
                query: jest.fn().mockResolvedValue({ rows: [] }),
                end: jest.fn().mockResolvedValue()
            }))

            process.env.DB_HOST = "localhost"
            process.env.DB_PORT = 5432
            process.env.DB_USER = "test"
            process.env.DB_PASSWORD = "test"
            process.env.DB_NAME = "test"

            const result = await ProductDataSource.getProducts()

            expect(Pool).toHaveBeenCalled()
            expect(result).toEqual([])
        })

        test("usa postgres por defecto si DB_TYPE no está definido", async () => {
            delete process.env.DB_TYPE

            Pool.mockImplementation(() => ({
                query: jest.fn().mockResolvedValue({ rows: [] }),
                end: jest.fn().mockResolvedValue()
            }))

            process.env.DB_HOST = "localhost"
            process.env.DB_PORT = 5432
            process.env.DB_USER = "test"
            process.env.DB_PASSWORD = "test"
            process.env.DB_NAME = "test"

            const result = await ProductDataSource.getProducts()

            expect(Pool).toHaveBeenCalled()
            expect(result).toEqual([])
        })

        test("lanza error si DB_TYPE no es válido", async () => {
            process.env.DB_TYPE = "invalid"

            await expect(ProductDataSource.getProducts()).rejects.toThrow("Unsupported DB_TYPE")
        })
    })
})