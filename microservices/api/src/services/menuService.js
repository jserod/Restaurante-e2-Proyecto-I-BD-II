/**
 * @fileoverview Service de menús. Capa de negocio entre controladores y DAO.
 * Valida existencia de recursos antes de operaciones destructivas.
 */

const DAOFactory = require("../dao/DAOFactory")
const menuDAO = DAOFactory.getMenuDAO()
const { NotFoundError } = require("../errors")

class MenuService {

    /** @returns {Promise<Array>} */
    async getAll() {
        return await menuDAO.getAll()
    }

    /**
     * Busca un menú por ID. Lanza NotFoundError si no existe.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getById(id) {
        const menu = await menuDAO.getById(id)
        if (!menu) {
            throw new NotFoundError("Menu not found")
        }
        return menu
    }

    /**
     * Obtiene menús de un restaurante específico.
     * @param {string} restaurantId
     * @returns {Promise<Array>}
     */
    async getByRestaurant(restaurantId) {
        return await menuDAO.getByRestaurant(restaurantId)
    }

    /**
     * Crea un nuevo menú.
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        return await menuDAO.create(data)
    }

    /**
     * Actualiza un menú existente. Verifica existencia primero.
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const menu = await this.getById(id)
        return await menuDAO.update(id, data)
    }

    /**
     * Elimina un menú. Verifica existencia primero y retorna el eliminado.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async delete(id) {
        const menu = await this.getById(id)
        await menuDAO.delete(id)
        return menu
    }
}

module.exports = new MenuService()