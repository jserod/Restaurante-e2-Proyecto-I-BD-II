// tests/unit/controllers/productsController.test.js
const { createMockReq, createMockRes, createMockNext } = require("../../helpers/mockExpress")

describe("ProductsController", () => {
    let productsController
    let productService

    beforeEach(() => {
        jest.resetModules()

        productService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/services/productService", () => productService)
        productsController = require("../../../src/controllers/productController")
    })

    describe("getAllProducts", () => {
        it("retorna todos los productos", async () => {
            const products = [{ id: 1, name: "Product 1" }]
            productService.getAll.mockResolvedValue(products)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await productsController.getAllProducts(req, res, next)

            expect(productService.getAll).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(products)
        })

        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            productService.getAll.mockRejectedValue(error)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await productsController.getAllProducts(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getProductById", () => {
        it("retorna producto por id", async () => {
            const product = { id: 1, name: "Product 1" }
            productService.getById.mockResolvedValue(product)

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.getProductById(req, res, next)

            expect(productService.getById).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith(product)
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            productService.getById.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.getProductById(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("createProduct", () => {
        it("crea producto con datos válidos", async () => {
            const created = { id: 1, menuId: 10, name: "Burger", price: 9.99 }
            productService.create.mockResolvedValue(created)

            const req = createMockReq({
                body: { menuId: 10, name: "Burger", description: "Delicious", price: 9.99, isAvailable: true }
            })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.createProduct(req, res, next)

            expect(productService.create).toHaveBeenCalledWith({
                menuId: 10,
                name: "Burger",
                description: "Delicious",
                price: 9.99,
                isAvailable: true
            })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith(created)
        })

        it("retorna 400 si falta menuId", async () => {
            const req = createMockReq({
                body: { name: "Burger", price: 9.99 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.createProduct(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "menuId, name and price are required" })
            expect(productService.create).not.toHaveBeenCalled()
        })

        it("retorna 400 si falta name", async () => {
            const req = createMockReq({
                body: { menuId: 10, price: 9.99 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.createProduct(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "menuId, name and price are required" })
        })

        it("retorna 400 si falta price", async () => {
            const req = createMockReq({
                body: { menuId: 10, name: "Burger" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.createProduct(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "menuId, name and price are required" })
        })

        it("retorna 400 si price es undefined", async () => {
            const req = createMockReq({
                body: { menuId: 10, name: "Burger", price: undefined }
            })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.createProduct(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "menuId, name and price are required" })
        })

        it("crea producto con price = 0", async () => {
            const created = { id: 1, menuId: 10, name: "Free", price: 0 }
            productService.create.mockResolvedValue(created)

            const req = createMockReq({
                body: { menuId: 10, name: "Free", price: 0 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.createProduct(req, res, next)

            expect(productService.create).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(201)
        })

        it("pasa errores del service a next", async () => {
            const error = new Error("DB fail")
            productService.create.mockRejectedValue(error)

            const req = createMockReq({
                body: { menuId: 10, name: "Burger", price: 9.99 }
            })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.createProduct(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("updateProduct", () => {
        it("actualiza producto", async () => {
            const updated = { id: 1, name: "Updated" }
            productService.update.mockResolvedValue(updated)

            const req = createMockReq({ params: { id: "1" }, body: { name: "Updated" } })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.updateProduct(req, res, next)

            expect(productService.update).toHaveBeenCalledWith("1", { name: "Updated" })
            expect(res.json).toHaveBeenCalledWith(updated)
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            productService.update.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" }, body: { name: "Updated" } })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.updateProduct(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("deleteProduct", () => {
        it("elimina producto", async () => {
            productService.delete.mockResolvedValue()

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.deleteProduct(req, res, next)

            expect(productService.delete).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith({ message: "Product deleted" })
        })

        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            productService.delete.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await productsController.deleteProduct(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})