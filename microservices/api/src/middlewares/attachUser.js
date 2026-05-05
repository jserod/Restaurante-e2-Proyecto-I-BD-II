/**
 * @fileoverview Middleware que sincroniza el usuario de Keycloak con la BD local.
 * Adjunta el perfil del usuario a req.user para uso posterior en controladores.
 */

const userService= require("../services/userService")

/**
 * Extrae el token de Keycloak, busca o crea el usuario en BD local
 * y adjunta req.user con dbId para los controladores.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function attachUser(req, res, next) {
  try {
    const token = req.kauth?.grant?.access_token?.content

    if (!token) return res.status(401).json({ error: "Unauthorized" })

    const user = await userService.findOrCreateUser({
      keycloakId: token.sub,
      email: token.email,
      name: token.preferred_username
    })

    req.user = { ...user, dbId: user.id }
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = attachUser