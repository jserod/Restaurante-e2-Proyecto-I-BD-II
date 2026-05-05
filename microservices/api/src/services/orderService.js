/**
 * @fileoverview Service de órdenes. Valida reglas de negocio antes de delegar al DAO.
 */

const DAOFactory = require("../dao/DAOFactory")
const orderDAO = DAOFactory.getOrderDAO()
const { BadRequestError, NotFoundError } = require("../errors")

class OrderService {

    /** @returns {Promise<Array>} */
    async getAll() {
        return await orderDAO.getAll()
    }

    /**
     * Busca una orden por ID. Lanza NotFoundError si no existe.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getById(id) {
        const order = await orderDAO.getById(id)
        if (!order) {
            throw new NotFoundError("Order not found")
        }
        return order
    }

    /**
     * Crea una orden validando que tenga al menos un ítem.
     * @param {Object} data
     * @param {Array} data.items - Ítems de la orden
     * @returns {Promise<Object>}
     */
    async create(data) {
        if (!data.items || data.items.length === 0) {
            throw new BadRequestError("Order must have at least one item")
        }
        return await orderDAO.create(data)
    }

    /**
     * Actualiza el estado de una orden. Verifica existencia primero.
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        await this.getById(id) 
        return await orderDAO.update(id, data)
    }

    /**
     * Elimina una orden. Verifica existencia primero.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(id) {
        await this.getById(id)
        await orderDAO.delete(id)
    }
}

module.exports = new OrderService()