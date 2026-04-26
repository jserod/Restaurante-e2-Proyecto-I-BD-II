const DAOFactory = require("../dao/DAOFactory")
const menuDAO = DAOFactory.getMenuDAO()

class MenuService {

    async getAll() {
        return await menuDAO.getAll()
    }

    async getById(id) {
        return await menuDAO.getById(id)
    }

    async getByRestaurant(restaurantId) {
        return await menuDAO.getByRestaurant(restaurantId)
    }

    async create(data) {
        return await menuDAO.create(data)
    }

    async update(id, data) {
        return await menuDAO.update(id, data)
    }

    async delete(id) {
        return await menuDAO.delete(id)
    }
}

module.exports = new MenuService()