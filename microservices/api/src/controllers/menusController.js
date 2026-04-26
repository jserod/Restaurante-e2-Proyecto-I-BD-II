const menuService = require("../services/menuService")

async function getMenus(req, res, next) {
    try {
        const menus = await menuService.getByRestaurant(req.params.restaurantId)
        res.json(menus)
    } catch (error) {
        next(error)
    }
}

async function getMenuById(req, res, next) {
    try {
        const menu = await menuService.getById(req.params.id)
        if (!menu) return res.status(404).json({ error: "Menu not found" })
        res.json(menu)
    } catch (error) {
        next(error)
    }
}

async function createMenu(req, res, next) {
    try {
        const { restaurantId, name, description, price, category } = req.body

        if (!restaurantId) {
            return res.status(400).json({ error: "restaurantId is required" })
        }

        const menu = await menuService.create({
            restaurantId,
            name,
            description,
            price,
            category
        })

        res.status(201).json(menu)
    } catch (error) {
        next(error)
    }
}

async function updateMenu(req, res, next) {
    try {
        const menu = await menuService.getById(req.params.id)
        if (!menu) return res.status(404).json({ error: "Menu not found" })

        const { name, description, price, category } = req.body
        const updated = await menuService.update(req.params.id, { name, description, price, category })
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function deleteMenu(req, res, next) {
    try {
        const menu = await menuService.getById(req.params.id)
        if (!menu) return res.status(404).json({ error: "Menu not found" })

        await menuService.delete(req.params.id)
        res.json({ message: "Menu deleted" })
    } catch (error) {
        next(error)
    }
}

async function getAllMenus(req, res, next) {
    try {
        const menus = await menuService.getAll()
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