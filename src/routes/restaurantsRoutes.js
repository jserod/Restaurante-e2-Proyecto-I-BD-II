const express = require("express")
const router = express.Router()

const { keycloak } = require("../config/keycloak")
const requireRole = require("../middlewares/requireRole")
const attachUser = require("../middlewares/attachUser")

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
 */
router.get("/", keycloak.protect(), attachUser, controller.getRestaurants)

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
 *         description: Restaurant not found
 */
router.get("/:id", keycloak.protect(), attachUser, controller.getRestaurantById)

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Registrar un restaurante (solo administradores)
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
 *       403:
 *         description: Forbidden
 */
router.post("/", keycloak.protect(), attachUser, requireRole("admin"), controller.createRestaurant)

/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     summary: Actualizar un restaurante (solo administradores)
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
 *       404:
 *         description: Restaurant not found
 */
router.put("/:id", keycloak.protect(), attachUser, requireRole("admin"), controller.updateRestaurant)

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     summary: Eliminar un restaurante (solo administradores)
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
 *       404:
 *         description: Restaurant not found
 */
router.delete("/:id", keycloak.protect(), attachUser, requireRole("admin"), controller.deleteRestaurant)

module.exports = router