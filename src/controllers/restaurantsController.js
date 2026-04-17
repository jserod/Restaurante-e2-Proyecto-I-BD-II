const restaurantsModel = require("../models/restaurants")

async function getRestaurants(req, res, next) {
    try {
        const restaurants = await restaurantsModel.getAllRestaurants()
        res.json(restaurants)
    } catch (error) {
        next(error)
    }
}

async function getRestaurantById(req, res, next) {
    try {
        const restaurant = await restaurantsModel.getRestaurantById(req.params.id)
        if (!restaurant) return res.status(404).json({ error: "Restaurant not found" })
        res.json(restaurant)
    } catch (error) {
        next(error)
    }
}

async function createRestaurant(req, res, next) {
    try {
        const { name, description, address } = req.body
        const restaurant = await restaurantsModel.createRestaurant({
            name,
            description,
            address
        })
        res.status(201).json(restaurant)
    } catch (error) {
        next(error)
    }
}

async function updateRestaurant(req, res, next) {
    try {
        const restaurant = await restaurantsModel.getRestaurantById(req.params.id)
        if (!restaurant) return res.status(404).json({ error: "Restaurant not found" })

        const { name, description, address } = req.body
        const updated = await restaurantsModel.updateRestaurant(
            req.params.id,
            { name, description, address }  // corregido: ahora pasa objeto completo
        )
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function deleteRestaurant(req, res, next) {
    try {
        const restaurant = await restaurantsModel.getRestaurantById(req.params.id)
        if (!restaurant) return res.status(404).json({ error: "Restaurant not found" })

        await restaurantsModel.deleteRestaurant(req.params.id)
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