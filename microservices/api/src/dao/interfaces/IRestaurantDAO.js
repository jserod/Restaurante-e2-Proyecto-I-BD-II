/**
 * @fileoverview Interfaz abstracta para DAO de restaurantes.
 * Define el contrato que deben implementar RestaurantPostgresDAO y RestaurantMongoDAO.
 */

class IRestaurantDAO {
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

module.exports = IRestaurantDAO