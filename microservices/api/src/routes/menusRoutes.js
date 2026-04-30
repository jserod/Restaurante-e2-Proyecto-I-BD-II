const express = require("express")
const router = express.Router()

const protect = require("../middlewares/keycloakProtect")
const requireRole = require("../middlewares/requireRole")
const { cache, invalidateCache, invalidateOnSuccess } = require("../middlewares/cache")

const controller = require("../controllers/menusController")

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
 *       401:
 *         description: No autorizado
 */
router.get("/", protect(), cache(120), controller.getAllMenus)

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
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del menú
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Menú no encontrado
 */
router.get("/:id", protect(), cache(300), controller.getMenuById)

/**
 * @swagger
 * /menus:
 *   post:
 *     summary: Crear un nuevo menú (solo admin)
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
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Menú creado
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 */
router.post("/", protect(), requireRole("admin"), async (req, res, next) => {
    await controller.createMenu(req, res, next)
    await invalidateOnSuccess("cache:GET:/menus*")
})

/**
 * @swagger
 * /menus/{id}:
 *   put:
 *     summary: Actualizar un menú existente (solo admin)
 *     tags: [menus]
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
 *     responses:
 *       200:
 *         description: Menú actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Menú no encontrado
 */
router.put("/:id", protect(), requireRole("admin"), async (req, res, next) => {
    await controller.updateMenu(req, res, next)
    await invalidateOnSuccess("cache:GET:/menus*")
})

/**
 * @swagger
 * /menus/{id}:
 *   delete:
 *     summary: Eliminar un menú (solo admin)
 *     tags: [menus]
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
 *         description: Menú eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Menú no encontrado
 */
router.delete("/:id", protect(), requireRole("admin"), async (req, res, next) => {
    await controller.deleteMenu(req, res, next)
    await invalidateOnSuccess("cache:GET:/menus*")
})

module.exports = router