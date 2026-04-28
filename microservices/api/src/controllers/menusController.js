const menuService = require("../services/MenuService")

class MenusController {
    async getAllMenus(req, res, next) {
        try {
            const menus = await menuService.getAll()
            res.json(menus)
        } catch (error) {
            next(error)
        }
    }

    async getMenuById(req, res, next) {
        try {
            const menu = await menuService.getById(req.params.id)
            res.json(menu)
        } catch (error) {
            next(error)
        }
    }

    async getMenusByRestaurant(req, res, next) {
        try {
            const menus = await menuService.getByRestaurant(req.params.restaurantId)
            res.json(menus)
        } catch (error) {
            next(error)
        }
    }

    async createMenu(req, res, next) {
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

    async updateMenu(req, res, next) {
        try {
            const menu = await menuService.update(req.params.id, req.body)
            res.json(menu)
        } catch (error) {
            next(error)
        }
    }

    async deleteMenu(req, res, next) {
        try {
            await menuService.delete(req.params.id)
            res.json({ message: "Menu deleted" })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new MenusController()