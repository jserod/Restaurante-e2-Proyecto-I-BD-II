const restaurantService = require("../services/restaurantService")
const { BadRequestError } = require("../errors")

async function getRestaurants(req, res, next) {
    try {
        const restaurants = await restaurantService.getAll()
        res.json(restaurants)
    } catch (error) {
        next(error)
    }
}

async function getRestaurantById(req, res, next) {
    try {
        const restaurant = await restaurantService.getById(req.params.id) // lanza NotFound si no existe
        res.json(restaurant)
    } catch (error) {
        next(error)
    }
}

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

async function updateRestaurant(req, res, next) {
    try {
        const updated = await restaurantService.update(req.params.id, req.body)
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

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