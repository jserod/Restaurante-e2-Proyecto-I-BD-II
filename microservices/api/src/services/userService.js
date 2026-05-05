/**
 * @fileoverview Service de usuarios. Gestiona sincronización Keycloak-BD local y operaciones CRUD.
 */

const DAOFactory = require("../dao/DAOFactory")
const userDAO = DAOFactory.getUserDAO()
const { NotFoundError } = require("../errors")

class UserService {

  /**
   * Busca usuario por keycloakId, o por email si no existe.
   * Si no existe en BD local, lo crea.
   * @param {Object} data
   * @param {string} data.keycloakId
   * @param {string} data.email
   * @param {string} data.name
   * @returns {Promise<Object>} Usuario existente o recién creado
   */
  async findOrCreateUser({ keycloakId, email, name }) {
    let user = await userDAO.getUserByKeycloakId(keycloakId)
    if (user) return user

    user = await userDAO.getUserByEmail(email)
    if (user) {
      return await userDAO.updateUser(user.id, { name, email })
    }

    return await userDAO.createUser({
      keycloakId,
      email,
      name
    })
  }

  /** @returns {Promise<Array>} */
  async getAllUsers() {
    return userDAO.getAllUsers()
  }

  /**
   * Busca un usuario por ID interno. Lanza NotFoundError si no existe.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getUserById(id) {
    const user = await userDAO.getUserById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }
    return user
  }

  /**
   * Actualiza un usuario por su keycloak_id.
   * @param {string} keycloakId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateUser(keycloakId, data) {
    const user = await userDAO.getUserByKeycloakId(keycloakId)
    if (!user) {
      throw new NotFoundError("User not found")
    }
    return userDAO.updateUser(user.id, data)
  }

  /**
   * Elimina un usuario por su ID interno. Verifica existencia primero.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    const user = await this.getUserById(id)
    return await userDAO.deleteUser(id)
  }
}

module.exports = new UserService()