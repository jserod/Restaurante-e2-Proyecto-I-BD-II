/**
 * @fileoverview Controlador de productos. Gestiona CRUD de productos dentro de menús.
 */

const productService = require("../services/productService")

/**
 * Obtiene todos los productos disponibles.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getAllProducts(req, res, next) {
    try {
        const products = await productService.getAll()
        res.json(products)
    } catch (error) {
        next(error)
    }
}

/**
 * Actualiza un producto existente.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getProductById(req, res, next) {
    try {
        const product = await productService.getById(req.params.id)
        res.json(product)
    } catch (error) {
        next(error)
    }
}

/**
 * Crea un nuevo producto dentro de un menú.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function createProduct(req, res, next) {
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

/**
 * Actualiza un producto existente.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function updateProduct(req, res, next) {
    try {
        const product = await productService.update(req.params.id, req.body)
        res.json(product)
    } catch (error) {
        next(error)
    }
}

/**
 * Elimina un producto por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function deleteProduct(req, res, next) {
    try {
        await productService.delete(req.params.id)
        res.json({ message: "Product deleted" })
    } catch (error) {
        next(error)
    }
}


module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
}