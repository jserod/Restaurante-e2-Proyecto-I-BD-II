const DAOFactory = require("../dao/DAOFactory")
const userDAO = DAOFactory.getUserDAO()

async function findOrCreateUser({ keycloakId, email, name }) {

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

async function getAllUsers() {
  return userDAO.getAllUsers()
}

async function getUserById(id) {
  return userDAO.getUserById(id)
}

async function updateUser(keycloakId, data) {
  return userDAO.updateUser(keycloakId, data)
}

async function deleteUser(id) {
  return userDAO.deleteUser(id)
}

module.exports = {
  findOrCreateUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
}