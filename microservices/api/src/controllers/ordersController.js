/**
 * @fileoverview Controlador de órdenes. Gestiona pedidos asociados a usuarios, restaurantes y reservas.
 */

const orderService = require("../services/orderService")
const { BadRequestError } = require("../errors")

/**
 * Crea una nueva orden para el usuario autenticado.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function createOrder(req, res, next) {
    try {
        const { restaurantId, reservationId, pickup, items } = req.body

        if (!items || items.length === 0) {
            throw new BadRequestError("Order must have at least one item")
        }

        const order = await orderService.create({
            userId: req.user.id,
            restaurantId,
            reservationId,
            pickup,
            items
        })
        res.status(201).json(order)
    } catch (error) {
        next(error)
    }
}

/**
 * Obtiene una orden por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getOrderById(req, res, next) {
    try {
        const order = await orderService.getById(req.params.id) // lanza NotFound si no existe
        res.json(order)
    } catch (error) {
        next(error)
    }
}

/**
 * Obtiene todas las órdenes del sistema.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getAllOrders(req, res, next) {
    try {
        const orders = await orderService.getAll()
        res.json(orders)
    } catch (error) {
        next(error)
    }
}

/**
 * Actualiza el estado de una orden.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function updateOrder(req, res, next) {
    try {
        const { status } = req.body
        const updated = await orderService.update(req.params.id, { status })
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

/**
 * Elimina una orden por su ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function deleteOrder(req, res, next) {
    try {
        await orderService.delete(req.params.id)
        res.json({ message: "Order deleted" })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    deleteOrder
}