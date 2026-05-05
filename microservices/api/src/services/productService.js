/**
 * @fileoverview Service de productos. Capa de negocio con validación de existencia.
 */

const DAOFactory = require("../dao/DAOFactory")
const productDAO = DAOFactory.getProductDAO()
const { NotFoundError } = require("../errors")

class ProductService {

    /** @returns {Promise<Array>} */
    async getAll() {
        return await productDAO.getAll()
    }

    /**
     * Busca un producto por ID. Lanza NotFoundError si no existe.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getById(id) {
        const product = await productDAO.getById(id)
        if (!product) {
            throw new NotFoundError("Product not found")
        }
        return product
    }

    /**
     * Crea un nuevo producto.
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        return await productDAO.create(data)
    }

    /**
     * Actualiza un producto existente. Verifica existencia primero.
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const product = await this.getById(id)
        return await productDAO.update(id, data)
    }

    /**
     * Elimina un producto. Verifica existencia primero y retorna el eliminado.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async delete(id) {
        const product = await this.getById(id)
        await productDAO.delete(id)
        return product
    }
}

module.exports = new ProductService()