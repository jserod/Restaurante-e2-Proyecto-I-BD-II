// tests/unit/services/productService.test.js

const { NotFoundError } = require("../../../src/errors")

describe("ProductService", () => {

    let productService
    let productDAO

    beforeEach(() => {
        jest.resetModules()

        productDAO = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/dao/DAOFactory", () => ({
            getProductDAO: () => productDAO
        }))

        productService = require("../../../src/services/productService")
    })

    describe("getAll", () => {
        it("retorna todos los productos", async () => {
            productDAO.getAll.mockResolvedValue([{ id: 1 }])

            const result = await productService.getAll()

            expect(result).toEqual([{ id: 1 }])
            expect(productDAO.getAll).toHaveBeenCalled()
        })
    })

    describe("getById", () => {
        it("retorna producto si existe", async () => {
            productDAO.getById.mockResolvedValue({ id: 1 })

            const result = await productService.getById(1)

            expect(result).toEqual({ id: 1 })
        })

        it("lanza NotFoundError si no existe", async () => {
            productDAO.getById.mockResolvedValue(null)

            await expect(productService.getById(1))
                .rejects
                .toThrow("Product not found")
        })
    })

    describe("create", () => {
        it("crea un producto", async () => {
            const data = { name: "Producto" }

            productDAO.create.mockResolvedValue(data)

            const result = await productService.create(data)

            expect(result).toEqual(data)
            expect(productDAO.create).toHaveBeenCalledWith(data)
        })
    })

    describe("update", () => {
        it("actualiza si existe", async () => {
            productDAO.getById.mockResolvedValue({ id: 1 })
            productDAO.update.mockResolvedValue({ id: 1, updated: true })

            const result = await productService.update(1, { name: "Nuevo" })

            expect(productDAO.update).toHaveBeenCalledWith(1, { name: "Nuevo" })
            expect(result).toEqual({ id: 1, updated: true })
        })

        it("lanza error si no existe", async () => {
            productDAO.getById.mockResolvedValue(null)

            await expect(productService.update(1, {}))
                .rejects
                .toThrow("Product not found")
        })
    })

    describe("delete", () => {
        it("elimina y retorna el producto", async () => {
            const product = { id: 1 }

            productDAO.getById.mockResolvedValue(product)
            productDAO.delete.mockResolvedValue()

            const result = await productService.delete(1)

            expect(productDAO.delete).toHaveBeenCalledWith(1)
            expect(result).toEqual(product)
        })

        it("lanza error si no existe", async () => {
            productDAO.getById.mockResolvedValue(null)

            await expect(productService.delete(1))
                .rejects
                .toThrow("Product not found")
        })
    })

})