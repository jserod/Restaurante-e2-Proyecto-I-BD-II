const orderService = require("../services/orderService")

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

async function getOrderById(req, res, next) {
    try {
        const order = await orderService.getById(req.params.id) // lanza NotFound si no existe
        res.json(order)
    } catch (error) {
        next(error)
    }
}

async function getAllOrders(req, res, next) {
    try {
        const orders = await orderService.getAll()
        res.json(orders)
    } catch (error) {
        next(error)
    }
}

async function updateOrder(req, res, next) {
    try {
        const { status } = req.body
        const updated = await orderService.update(req.params.id, { status })
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

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