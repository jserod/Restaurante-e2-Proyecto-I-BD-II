const express = require("express")
const router = express.Router()

const protect = require("../middlewares/keycloakProtect")
const attachUser = require("../middlewares/attachUser")

const controller = require("../controllers/reservationsController")

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Listar todas las reservas
 *     tags: [reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reservas
 *       401:
 *         description: No autorizado
 */
router.get("/", protect(), attachUser, controller.getAllReservations)

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Obtener una reserva por ID
 *     tags: [reservations]
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
 *         description: Datos de la reserva
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Reserva no encontrada
 */
router.get("/:id", protect(), attachUser, controller.getReservationById)

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId, partySize, reservationDate]
 *             properties:
 *               restaurantId:
 *                 type: string
 *               partySize:
 *                 type: integer
 *               reservationDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reserva creada
 *       401:
 *         description: No autorizado
 */
router.post("/", protect(), attachUser, controller.createReservation)

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Actualizar una reserva
 *     tags: [reservations]
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
 *               partySize:
 *                 type: integer
 *               reservationDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva actualizada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Reserva no encontrada
 */
router.put("/:id", protect(), attachUser, controller.updateReservation)

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Cancelar una reserva
 *     tags: [reservations]
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
 *         description: Reserva cancelada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No puede cancelar reservas de otros usuarios
 *       404:
 *         description: Reserva no encontrada
 */
router.delete("/:id", protect(), attachUser, controller.cancelReservation)

module.exports = router