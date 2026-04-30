const express = require("express")
const router = express.Router()

const protect = require("../middlewares/keycloakProtect")
const requireRole = require("../middlewares/requireRole")
const { cache, invalidateCache, invalidateOnSuccess } = require("../middlewares/cache")

const controller = require("../controllers/productController")

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar todos los productos
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos
 *       401:
 *         description: No autorizado
 */
router.get("/", protect(), cache(60), controller.getAllProducts)

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del producto
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
router.get("/:id", protect(), cache(300), controller.getProductById)

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear un nuevo producto (solo admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menuId, name, price]
 *             properties:
 *               menuId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 */
router.post("/", protect(), requireRole("admin"), async (req, res, next) => {
    await controller.createProduct(req, res, next)
    await invalidateOnSuccess("cache:GET:/products*")
})

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar un producto (solo admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Producto no encontrado
 */
router.put("/:id", protect(), requireRole("admin"), async (req, res, next) => {
    await controller.updateProduct(req, res, next)
    await invalidateOnSuccess("cache:GET:/products*")
})

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto (solo admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Producto no encontrado
 */
router.delete("/:id", protect(), requireRole("admin"), async (req, res, next) => {
    await controller.deleteProduct(req, res, next)
    await invalidateOnSuccess("cache:GET:/products*")
})

module.exports = router