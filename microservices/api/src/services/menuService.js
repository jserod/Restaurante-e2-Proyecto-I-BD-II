const DAOFactory = require("../dao/DAOFactory")
const menuDAO = DAOFactory.getMenuDAO()
const { NotFoundError } = require("../errors")

class MenuService {
    async getAll() {
        return await menuDAO.getAll()
    }

    async getById(id) {
        const menu = await menuDAO.getById(id)
        if (!menu) {
            throw new NotFoundError("Menu not found")
        }
        return menu
    }

    async getByRestaurant(restaurantId) {
        return await menuDAO.getByRestaurant(restaurantId)
    }

    async create(data) {
        return await menuDAO.create(data)
    }

    async update(id, data) {
        const menu = await this.getById(id)
        return await menuDAO.update(id, data)
    }

    async delete(id) {
        const menu = await this.getById(id)
        await menuDAO.delete(id)
        return menu
    }
}

module.exports = new MenuService()