const keycloakService = require("../services/keycloakService")
const userService = require("../services/userService")

async function getUsers(req, res, next) {
  try {
    const users = await keycloakService.getAllKeycloakUsers()
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      enabled: u.enabled
    })))
  } catch (error) {
    next(error)
  }
}

async function getMe(req, res, next) {
  try {
    const token = req.kauth.grant.access_token.content
    const user = await userService.findOrCreateUser({
      keycloakId: token.sub,
      email: token.email,
      name: token.preferred_username
    })
    res.json(user)
  } catch (error) {
    next(error)
  }
}

async function updateUser(req, res, next) {
  try {
    const { email, firstName, lastName } = req.body

    const keycloakPayload = {}
    if (email) keycloakPayload.email = email
    if (firstName) keycloakPayload.firstName = firstName
    if (lastName) keycloakPayload.lastName = lastName

    // Si no hay nada que actualizar
    if (Object.keys(keycloakPayload).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" })
    }

    // Actualiza en Keycloak (lanza error si falla)
    await keycloakService.updateKeycloakUser(req.params.id, keycloakPayload)

    // Actualiza en BD local (lanza error si no existe)
    await userService.updateUser(req.params.id, {
      email,
      name: [firstName, lastName].filter(Boolean).join(" ") || undefined
    })

    res.json({ message: "User updated" })
  } catch (error) {
    next(error)
  }
}

async function deleteUser(req, res, next) {
  try {
    // Elimina de Keycloak (lanza error si falla)
    await keycloakService.deleteKeycloakUser(req.params.id)

    // Elimina de BD local (lanza error si no existe)
    await userService.deleteUser(req.params.id)

    res.json({ message: "User deleted" })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getUsers,
  getMe,
  updateUser,
  deleteUser
}