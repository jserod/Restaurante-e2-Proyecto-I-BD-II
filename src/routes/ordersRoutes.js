const express = require("express")
const router = express.Router()

const { keycloak } = require("../config/keycloak")
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
 */
router.get("/", keycloak.protect(), attachUser, controller.getAllOrders)

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
 *       404:
 *         description: Order not found
 */
router.get("/:id", keycloak.protect(), attachUser, controller.getOrderById)

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
 *         description: Order must have at least one item
 */
router.post("/", keycloak.protect(), attachUser, controller.createOrder)

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
 *       404:
 *         description: Order not found
 */
router.put("/:id", keycloak.protect(), attachUser, controller.updateOrder)

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
 *       404:
 *         description: Order not found
 */
router.delete("/:id", keycloak.protect(), attachUser, controller.deleteOrder)

module.exports = router