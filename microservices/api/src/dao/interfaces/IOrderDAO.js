/**
 * @fileoverview Interfaz abstracta para DAO de órdenes.
 * Define el contrato que deben implementar OrderPostgresDAO y OrderMongoDAO.
 */

class IOrderDAO {
    async getAll() {
        throw new Error("Method not implemented")
    }

    async getById(id) {
        throw new Error("Method not implemented")
    }

    async create(data) {
        throw new Error("Method not implemented")
    }
    
    async update(id, data) {
        throw new Error("Method not implemented")
    }

    async delete(id) {
        throw new Error("Method not implemented")
    }
}

module.exports = IOrderDAO