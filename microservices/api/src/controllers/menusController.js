/**
 * @fileoverview Controlador de menús. Gestiona CRUD de menús asociados a restaurantes.
 */

const menuService = require("../services/menuService")

/**
 * Obtiene todos los menús disponibles.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getAllMenus(req, res, next) {
    try {
        const menus = await menuService.getAll()
        res.json(menus)
    } catch (error) {
        next(error)
    }
}

/**
 * Obtiene un menú por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getMenuById(req, res, next) {
    try {
        const menu = await menuService.getById(req.params.id)
        res.json(menu)
    } catch (error) {
        next(error)
    }
}

/**
 * Obtiene todos los menús de un restaurante específico.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getMenusByRestaurant(req, res, next) {
    try {
        const menus = await menuService.getByRestaurant(req.params.restaurantId)
        res.json(menus)
    } catch (error) {
        next(error)
    }
}

/**
 * Crea un nuevo menú para un restaurante.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function createMenu(req, res, next) {
    try {
        const { restaurantId, name, description } = req.body
        if (!restaurantId || !name) {
            return res.status(400).json({ error: "restaurantId and name are required" })
        }
        const menu = await menuService.create({ restaurantId, name, description })
        res.status(201).json(menu)
    } catch (error) {
        next(error)
    }
}

/**
 * Actualiza un menú existente.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function updateMenu(req, res, next) {
    try {
        const menu = await menuService.update(req.params.id, req.body)
        res.json(menu)
    } catch (error) {
        next(error)
    }
}

/**
 * Elimina un menú por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function deleteMenu(req, res, next) {
    try {
        await menuService.delete(req.params.id)
        res.json({ message: "Menu deleted" })
    } catch (error) {
        next(error)
    }
}


module.exports = {
    getAllMenus,
    getMenuById,
    getMenusByRestaurant,
    createMenu,
    updateMenu,
    deleteMenu
}