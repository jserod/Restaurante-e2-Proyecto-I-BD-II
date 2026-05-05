/**
 * @fileoverview Interfaz abstracta para DAO de usuarios.
 * Define el contrato que deben implementar UserPostgresDAO y UserMongoDAO.
 */


class IUserDAO {
  async getAllUsers() {
    throw new Error("Method not implemented")
  }

  async getUserById(id) {
    throw new Error("Method not implemented")
  }

  async getUserByKeycloakId(keycloakId) {
    throw new Error("Method not implemented")
  }

  async getUserByEmail(email) {
    throw new Error("Method not implemented")
  }

  async createUser(userData) {
    throw new Error("Method not implemented")
  }

  async updateUser(id, userData) {
    throw new Error("Method not implemented")
  }

  async deleteUser(id) {
    throw new Error("Method not implemented")
  }
}

module.exports = IUserDAO