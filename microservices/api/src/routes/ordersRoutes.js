const express = require("express")
const router = express.Router()

const protect = require("../middlewares/keycloakProtect")
const attachUser = require("../middlewares/attachUser")

const controller = require("../controllers/ordersController")

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar todos los pedidos
 *     tags: [orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: No autorizado
 */
router.get("/", protect(), attachUser, controller.getAllOrders)

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener detalles de un pedido
 *     tags: [orders]
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
 *         description: Datos del pedido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Pedido no encontrado
 */
router.get("/:id", protect(), attachUser, controller.getOrderById)

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Realizar un pedido
 *     tags: [orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId, items]
 *             properties:
 *               restaurantId:
 *                 type: string
 *               reservationId:
 *                 type: string
 *               pickup:
 *                 type: boolean
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [menuId, quantity]
 *                   properties:
 *                     menuId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Pedido creado
 *       400:
 *         description: El pedido debe tener al menos un item
 *       401:
 *         description: No autorizado
 */
router.post("/", protect(), attachUser, controller.createOrder)

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Actualizar estado de un pedido
 *     tags: [orders]
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
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, delivered]
 *     responses:
 *       200:
 *         description: Pedido actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Pedido no encontrado
 */
router.put("/:id", protect(), attachUser, controller.updateOrder)

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Eliminar un pedido
 *     tags: [orders]
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
 *         description: Pedido eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Pedido no encontrado
 */
router.delete("/:id", protect(), attachUser, controller.deleteOrder)

module.exports = router