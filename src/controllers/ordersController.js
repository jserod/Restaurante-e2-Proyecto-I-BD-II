const ordersModel = require("../models/orders")

async function createOrder(req, res, next) {
    try {
        const { restaurantId, reservationId, pickup, items } = req.body

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "Order must have at least one item" })
        }

        const order = await ordersModel.createOrder({
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
        const order = await ordersModel.getOrderById(req.params.id)
        if (!order) return res.status(404).json({ error: "Order not found" })
        res.json(order)
    } catch (error) {
        next(error)
    }
}

async function getAllOrders(req, res, next) {
    try {
        const orders = await ordersModel.getAllOrders()
        res.json(orders)
    } catch (error) {
        next(error)
    }
}

async function updateOrder(req, res, next) {
    try {
        const order = await ordersModel.getOrderById(req.params.id)
        if (!order) return res.status(404).json({ error: "Order not found" })

        const { status } = req.body
        const updated = await ordersModel.updateOrder(req.params.id, { status })
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function deleteOrder(req, res, next) {
    try {
        const order = await ordersModel.getOrderById(req.params.id)
        if (!order) return res.status(404).json({ error: "Order not found" })

        await ordersModel.deleteOrder(req.params.id)
        res.json({ message: "Order deleted" })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAllOrders,
    createOrder,
    getOrderById,
    updateOrder,
    deleteOrder
}