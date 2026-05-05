/**
 * @fileoverview Controlador de restaurantes. Gestiona CRUD de restaurantes en el sistema.
 */

const restaurantService = require("../services/restaurantService")
const { BadRequestError } = require("../errors")

/**
 * Obtiene todos los restaurantes registrados.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getRestaurants(req, res, next) {
    try {
        const restaurants = await restaurantService.getAll()
        res.json(restaurants)
    } catch (error) {
        next(error)
    }
}

/**
 * Obtiene un restaurante por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getRestaurantById(req, res, next) {
    try {
        const restaurant = await restaurantService.getById(req.params.id) // lanza NotFound si no existe
        res.json(restaurant)
    } catch (error) {
        next(error)
    }
}

/**
 * Crea un nuevo restaurante. Requiere nombre obligatorio.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function createRestaurant(req, res, next) {
    try {
        if (!req.body.name) {
            throw new BadRequestError("Name is required")
        }
        const restaurant = await restaurantService.create(req.body)
        res.status(201).json(restaurant)
    } catch (error) {
        next(error)
    }
}

/**
 * Actualiza un restaurante existente.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function updateRestaurant(req, res, next) {
    try {
        const updated = await restaurantService.update(req.params.id, req.body)
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

/**
 * Elimina un restaurante por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function deleteRestaurant(req, res, next) {
    try {
        await restaurantService.delete(req.params.id)
        res.json({ message: "Restaurant deleted" })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant
}