const express = require("express")
const router = express.Router()

const { keycloak } = require("../config/keycloak")
const attachUser = require("../middlewares/attachUser")

const controller = require("../controllers/ReservationsController")

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
 *                 type: integer
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
 *         description: Unauthorized
 */
router.post(
    "/",
    keycloak.protect(),
    attachUser,
    controller.createReservation
)

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
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reservation not found
 */
router.delete(
    "/:id",
    keycloak.protect(),
    attachUser,
    controller.cancelReservation
)

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
 */
router.get(
    "/",
    keycloak.protect(),
    attachUser,
    controller.getAllReservations
)

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
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la reserva
 *       404:
 *         description: Reservation not found
 */
router.get(
    "/:id",
    keycloak.protect(),
    attachUser,
    controller.getReservationById
)

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
 *           type: integer
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
 *       404:
 *         description: Reservation not found
 */
router.put(
    "/:id",
    keycloak.protect(),
    attachUser,
    controller.updateReservation
)

module.exports = router