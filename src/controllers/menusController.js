const menusModel = require("../models/menus")

async function getMenus(req, res, next) {
    try {
        const menus = await menusModel.getMenusByRestaurant(req.params.restaurantId)
        res.json(menus)
    } catch (error) {
        next(error)
    }
}

async function getMenuById(req, res, next) {
    try {
        const menu = await menusModel.getMenuById(req.params.id)
        if (!menu) return res.status(404).json({ error: "Menu not found" })
        res.json(menu)
    } catch (error) {
        next(error)
    }
}

async function createMenu(req, res, next) {
    try {
        const { restaurantId, name, description, price } = req.body

        if (!restaurantId) {
            return res.status(400).json({ error: "restaurantId is required" })
        }

        const menu = await menusModel.createMenu({
            restaurantId,
            name,
            description,
            price
        })

        res.status(201).json(menu)
    } catch (error) {
        next(error)
    }
}

async function updateMenu(req, res, next) {
    try {
        const menu = await menusModel.getMenuById(req.params.id)
        if (!menu) return res.status(404).json({ error: "Menu not found" })

        const { name, description, price } = req.body
        const updated = await menusModel.updateMenu(req.params.id, { name, description, price })
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function deleteMenu(req, res, next) {
    try {
        const menu = await menusModel.getMenuById(req.params.id)
        if (!menu) return res.status(404).json({ error: "Menu not found" })

        await menusModel.deleteMenu(req.params.id)
        res.json({ message: "Menu deleted" })
    } catch (error) {
        next(error)
    }
}

async function getAllMenus(req, res, next) {
    try {
        const menus = await menusModel.getAllMenus()
        res.json(menus)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAllMenus,
    getMenus,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu
}