/**
 * @fileoverview Controlador de búsqueda.
 * Expone búsqueda full-text por texto libre, filtrado por categoría y reindexación masiva.
 */

const { client, INDEX } = require("./config/elastic")
const productDataSource = require("./productDataSource")

/**
 * Búsqueda full-text en nombre y descripción de productos.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function searchByText(req, res, next) {
    try {
        const { q } = req.query
        if (!q) {
            return res.status(400).json({ error: "Query parameter 'q' is required" })
        }

        const result = await client.search({
            index: INDEX,
            query: {
                multi_match: {
                    query: q,
                    fields: ["name", "description"],
                    fuzziness: "AUTO"
                }
            }
        })

        res.json(result.hits.hits.map(h => h._source))
    } catch (error) {
        next(error)
    }
}

/**
 * Búsqueda por categoría exacta (menú al que pertenece el producto).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function searchByCategory(req, res, next) {
    try {
        const { categoria } = req.params

        const result = await client.search({
            index: INDEX,
            query: {
                term: { category: categoria.toLowerCase() }
            }
        })

        res.json(result.hits.hits.map(h => h._source))
    } catch (error) {
        next(error)
    }
}

/**
 * Reindexa todos los productos desde la BD hacia Elasticsearch.
 * Útil para sincronización inicial o tras cambios masivos en productos.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function reindex(req, res, next) {
    try {
        const products = await productDataSource.getProducts()

        if (products.length === 0) {
            return res.json({ message: "No products to index", indexed: 0 })
        }

        const operations = products.flatMap(product => [
            { index: { _index: INDEX, _id: product.id } },
            product
        ])

        const result = await client.bulk({ operations })

        res.json({
            message: "Reindex completed",
            indexed: products.length,
            errors: result.errors
        })

    } catch (error) {
        next(error)
    }
}

module.exports = { searchByText, searchByCategory, reindex }