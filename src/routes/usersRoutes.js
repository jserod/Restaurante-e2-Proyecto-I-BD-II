const express = require("express")
const router = express.Router()

const { keycloak } = require("../config/keycloak")
const requireRole = require("../middlewares/requireRole")
const usersController = require("../controllers/usersController")

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    keycloak.protect(),
    requireRole("admin"),
    usersController.getUsers
)

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener detalles del usuario autenticado
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/me",
    keycloak.protect(),
    usersController.getMe
)

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar información de un usuario en Keycloak
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Keycloak user UUID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: User not found
 */
router.put(
    "/:id",
    keycloak.protect(),
    usersController.updateUser
)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario de Keycloak
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Keycloak user UUID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: User not found
 */
router.delete(
    "/:id",
    keycloak.protect(),
    requireRole("admin"),
    usersController.deleteUser
)

module.exports = router