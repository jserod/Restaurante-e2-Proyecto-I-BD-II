const productService = require("../services/productService")

class ProductsController {
    async getAllProducts(req, res, next) {
        try {
            const products = await productService.getAll()
            res.json(products)
        } catch (error) {
            next(error)
        }
    }

    async getProductById(req, res, next) {
        try {
            const product = await productService.getById(req.params.id)
            res.json(product)
        } catch (error) {
            next(error)
        }
    }

    async createProduct(req, res, next) {
        try {
            const { menuId, name, description, price, isAvailable } = req.body
            if (!menuId || !name || price === undefined) {
                return res.status(400).json({ error: "menuId, name and price are required" })
            }
            const product = await productService.create({
                menuId, name, description, price, isAvailable
            })
            res.status(201).json(product)
        } catch (error) {
            next(error)
        }
    }

    async updateProduct(req, res, next) {
        try {
            const product = await productService.update(req.params.id, req.body)
            res.json(product)
        } catch (error) {
            next(error)
        }
    }

    async deleteProduct(req, res, next) {
        try {
            await productService.delete(req.params.id)
            res.json({ message: "Product deleted" })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new ProductsController()