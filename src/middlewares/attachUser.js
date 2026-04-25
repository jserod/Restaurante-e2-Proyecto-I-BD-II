const userService= require("../services/userService")

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