const DAOFactory = require("../dao/DAOFactory")
const userDAO = DAOFactory.getUserDAO()
const { NotFoundError } = require("../errors")

class UserService {

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

  async getAllUsers() {
    return userDAO.getAllUsers()
  }

  async getUserById(id) {
    const user = await userDAO.getUserById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }
    return user
  }

  async updateUser(keycloakId, data) {
    const user = await userDAO.getUserByKeycloakId(keycloakId)
    if (!user) {
      throw new NotFoundError("User not found")
    }
    return userDAO.updateUser(user.id, data)
  }

  async deleteUser(id) {
    const user = await userDAO.getUserById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }
    return userDAO.deleteUser(id)
  }
}

module.exports = new UserService()