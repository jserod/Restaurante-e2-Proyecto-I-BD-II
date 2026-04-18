const http = require("http")
const userService = require("../services/userService")

const KEYCLOAK_URL = process.env.KEYCLOAK_URL
const REALM = process.env.KEYCLOAK_REALM
const ADMIN_USER = process.env.KEYCLOAK_ADMIN
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD

function fetchRequest(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? (typeof body === "string" ? body : JSON.stringify(body)) : null
    const urlObj = new URL(url)

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + (urlObj.search || ""),
      method,
      headers: {
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
        ...headers
      }
    }

    const req = http.request(options, res => {
      let data = ""
      res.on("data", chunk => data += chunk)
      res.on("end", () => resolve({ status: res.statusCode, body: data }))
    })

    req.on("error", reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

async function getAdminToken() {
  const body = `grant_type=password&client_id=admin-cli&username=${ADMIN_USER}&password=${ADMIN_PASSWORD}`
  const res = await fetchRequest(
    "POST",
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    body,
    { "Content-Type": "application/x-www-form-urlencoded" }
  )
  return JSON.parse(res.body).access_token
}

async function getUsers(req, res, next) {
  try {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
      "GET",
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
      null,
      { "Authorization": `Bearer ${adminToken}` }
    )
    const users = JSON.parse(response.body)
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
    const adminToken = await getAdminToken()
    const { username, email, firstName, lastName } = req.body

    const response = await fetchRequest(
      "PUT",
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${req.params.id}`,
      JSON.stringify({ username, email, firstName, lastName }),
      {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      }
    )

    if (response.status === 404) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ message: "User updated" })
  } catch (error) {
    next(error)
  }
}

async function deleteUser(req, res, next) {
  try {
    const adminToken = await getAdminToken()

    const response = await fetchRequest(
      "DELETE",
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${req.params.id}`,
      null,
      { "Authorization": `Bearer ${adminToken}` }
    )

    if (response.status === 404) {
      return res.status(404).json({ error: "User not found" })
    }

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