const express = require("express")
const router = express.Router()
const controller = require("./searchController")

/**
 * @openapi
 * /search/reindex:
 *   post:
 *     summary: Reindexar todos los productos
 *     description: Carga todos los datos desde la base de datos y los indexa en ElasticSearch
 *     responses:
 *       200:
 *         description: Resultado del proceso de indexación
 */
router.post("/reindex", controller.reindex)

/**
 * @openapi
 * /search/products:
 *   get:
 *     summary: Buscar productos por texto
 *     description: Realiza una búsqueda en nombre, descripción y categoría
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Texto a buscar
 *     responses:
 *       200:
 *         description: Lista de productos encontrados
 */
router.get("/products", controller.searchByText)

/**
 * @openapi
 * /search/products/category/{categoria}:
 *   get:
 *     summary: Buscar productos por categoría
 *     parameters:
 *       - in: path
 *         name: categoria
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de productos filtrados
 */
router.get("/products/category/:categoria", controller.searchByCategory)

module.exports = router