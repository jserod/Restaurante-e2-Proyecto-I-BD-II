/**
 * @fileoverview Middleware de autorización basado en roles de Keycloak.
 * Verifica roles a nivel de cliente (resource_access) y realm (realm_access).
 */

/**
 * Factory que retorna middleware de control de acceso por rol.
 * @param {string} role - Rol requerido para acceder al recurso
 * @returns {Function} Middleware de Express
 */
function requireRole(role) {
  return (req, res, next) => {
    const token = req.kauth?.grant?.access_token?.content

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // CLIENT ROLES (Keycloak)
    const clientRoles =
      token.resource_access?.["restaurant-api"]?.roles || []

    // REALM ROLES (por si acaso)
    const realmRoles =
      token.realm_access?.roles || []

    const roles = [...clientRoles, ...realmRoles]

    console.log("USER ROLES:", roles)

    if (!roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    next()
  }
}

module.exports = requireRole