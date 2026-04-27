const DAOFactory = require("../dao/DAOFactory")
const restaurantDAO = DAOFactory.getRestaurantDAO()
const { NotFoundError, AppError } = require("../errors")

class RestaurantService {
    async getAll() {
        return restaurantDAO.getAll()
    }

    async getById(id) {
        const restaurant = await restaurantDAO.getById(id)
        if (!restaurant) {
            throw new NotFoundError("Restaurant not found")
        }
        return restaurant
    }

    async create({ name, description, address }) {
        if (!name) {
            throw new AppError("Name is required", 400)
        }
        return restaurantDAO.create({ name, description, address })
    }

    async update(id, data) {
        const restaurant = await this.getById(id)
        return restaurantDAO.update(id, data)
    }

    async delete(id) {
        await this.getById(id)
        await restaurantDAO.delete(id)
    }
}

module.exports = new RestaurantService()