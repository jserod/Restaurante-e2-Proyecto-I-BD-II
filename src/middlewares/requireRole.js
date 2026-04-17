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