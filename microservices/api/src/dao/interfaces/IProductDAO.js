/**
 * @fileoverview Interfaz abstracta para DAO de productos.
 * Define el contrato que deben implementar ProductPostgresDAO y ProductMongoDAO.
 */

class IProductDAO {
    async getAll() {
        throw new Error("Not implemented")
    }

    async getById(id) {
        throw new Error("Not implemented")
    }

    async create(data) {
        throw new Error("Not implemented")
    }

    async update(id, data) {
        throw new Error("Not implemented")
    }

    async delete(id) {
        throw new Error("Not implemented")
    }
}

module.exports = IProductDAO