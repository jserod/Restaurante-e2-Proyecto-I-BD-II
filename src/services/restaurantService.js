const DAOFactory = require("../dao/DAOFactory")

const restaurantDAO = DAOFactory.getRestaurantDAO()

class RestaurantService {

    async getAll() {
        return await restaurantDAO.getAll()
    }

    async getById(id) {
        return await restaurantDAO.getById(id)
    }

    async create(data) {
        return await restaurantDAO.create(data)
    }

    async update(id, data) {
        return await restaurantDAO.update(id, data)
    }

    async delete(id) {
        return await restaurantDAO.delete(id)
    }
}

module.exports = new RestaurantService()