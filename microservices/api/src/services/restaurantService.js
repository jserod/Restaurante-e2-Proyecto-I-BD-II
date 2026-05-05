/**
 * @fileoverview Service de restaurantes. Valida reglas de negocio básicas.
 */

const DAOFactory = require("../dao/DAOFactory")
const restaurantDAO = DAOFactory.getRestaurantDAO()
const { NotFoundError, AppError } = require("../errors")

class RestaurantService {

    /** @returns {Promise<Array>} */
    async getAll() {
        return restaurantDAO.getAll()
    }

    /**
     * Busca un restaurante por ID. Lanza NotFoundError si no existe.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getById(id) {
        const restaurant = await restaurantDAO.getById(id)
        if (!restaurant) {
            throw new NotFoundError("Restaurant not found")
        }
        return restaurant
    }

    /**
     * Crea un restaurante validando que tenga nombre.
     * @param {Object} data
     * @param {string} data.name - Nombre obligatorio
     * @returns {Promise<Object>}
     */
    async create({ name, description, address }) {
        if (!name) {
            throw new AppError("Name is required", 400)
        }
        return restaurantDAO.create({ name, description, address })
    }

    /**
     * Actualiza un restaurante existente. Verifica existencia primero.
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const restaurant = await this.getById(id)
        return restaurantDAO.update(id, data)
    }

    /**
     * Elimina un restaurante. Verifica existencia primero.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(id) {
        await this.getById(id)
        await restaurantDAO.delete(id)
    }
}

module.exports = new RestaurantService()