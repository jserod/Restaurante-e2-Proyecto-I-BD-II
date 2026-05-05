const express = require("express")
const router = express.Router()

const protect = require("../middlewares/keycloakProtect")
const requireRole = require("../middlewares/requireRole")
const attachUser = require("../middlewares/attachUser")
const { cache, invalidateOnSuccess } = require("../middlewares/cache")

const controller = require("../controllers/restaurantsController")

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Listar restaurantes disponibles
 *     tags: [restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de restaurantes
 *       401:
 *         description: No autorizado
 */
router.get("/", protect(), attachUser, cache(300), controller.getRestaurants)

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Obtener un restaurante por ID
 *     tags: [restaurants]
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
 *         description: Datos del restaurante
 *       404:
 *         description: Restaurante no encontrado
 */
router.get("/:id", protect(), attachUser, cache(300), controller.getRestaurantById)

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Registrar un restaurante (solo admin)
 *     tags: [restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Restaurante creado
 *       400:
 *         description: Faltan campos requeridos (name)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 */
router.post("/", protect(), attachUser, requireRole("admin"), async (req, res, next) => {
    await controller.createRestaurant(req, res, next)
    await invalidateOnSuccess("cache:GET:/restaurants*")
})

/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     summary: Actualizar un restaurante (solo admin)
 *     tags: [restaurants]
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
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Restaurante actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Restaurante no encontrado
 */
router.put("/:id", protect(), attachUser, requireRole("admin"), async (req, res, next) => {
    await controller.updateRestaurant(req, res, next)
    await invalidateOnSuccess("cache:GET:/restaurants*")
})

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     summary: Eliminar un restaurante (solo admin)
 *     tags: [restaurants]
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
 *         description: Restaurante eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Restaurante no encontrado
 */
router.delete("/:id", protect(), attachUser, requireRole("admin"), async (req, res, next) => {
    await controller.deleteRestaurant(req, res, next)
    await invalidateOnSuccess("cache:GET:/restaurants*")
})

module.exports = router