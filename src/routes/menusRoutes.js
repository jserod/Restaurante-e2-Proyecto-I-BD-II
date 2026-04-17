const express = require("express")
const router = express.Router()

const { keycloak } = require("../config/keycloak")
const requireRole = require("../middlewares/requireRole")

const controller = require("../controllers/menusController")

/**
 * @swagger
 * /menus/{id}:
 *   get:
 *     summary: Obtener detalles de un menú específico
 *     tags: [menus]
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
 *         description: Datos del menú
 *       404:
 *         description: Menu not found
 */
router.get(
    "/:id",
    keycloak.protect(),
    controller.getMenuById
)

/**
 * @swagger
 * /menus:
 *   post:
 *     summary: Crear un nuevo menú para un restaurante
 *     tags: [menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId, name, price]
 *             properties:
 *               restaurantId:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Menú creado
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    keycloak.protect(),
    requireRole("admin"),
    controller.createMenu
)

/**
 * @swagger
 * /menus/{id}:
 *   put:
 *     summary: Actualizar un menú existente
 *     tags: [menus]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Menú actualizado
 *       404:
 *         description: Menu not found
 */
router.put(
    "/:id",
    keycloak.protect(),
    requireRole("admin"),
    controller.updateMenu
)

/**
 * @swagger
 * /menus/{id}:
 *   delete:
 *     summary: Eliminar un menú
 *     tags: [menus]
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
 *         description: Menú eliminado
 *       404:
 *         description: Menu not found
 */
router.delete(
    "/:id",
    keycloak.protect(),
    requireRole("admin"),
    controller.deleteMenu
)

/**
 * @swagger
 * /menus:
 *   get:
 *     summary: Listar todos los menús
 *     tags: [menus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de menús
 */
router.get(
    "/",
    keycloak.protect(),
    controller.getAllMenus
)

module.exports = router