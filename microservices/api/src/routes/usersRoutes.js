const express = require("express")
const router = express.Router()

const protect = require("../middlewares/keycloakProtect")
const requireRole = require("../middlewares/requireRole")
const usersController = require("../controllers/usersController")

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar todos los usuarios (solo admin)
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autorizado (token inválido o expirado)
 *       403:
 *         description: No tiene permisos de administrador
 */
router.get("/", protect(), requireRole("admin"), usersController.getUsers)

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
 *         description: No autorizado (token inválido o expirado)
 */
router.get("/me", protect(), usersController.getMe)

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar información de un usuario
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
 *       400:
 *         description: No hay campos válidos para actualizar
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id", protect(), usersController.updateUser)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario (solo admin)
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
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Usuario no encontrado
 */
router.delete("/:id", protect(), requireRole("admin"), usersController.deleteUser)

module.exports = router