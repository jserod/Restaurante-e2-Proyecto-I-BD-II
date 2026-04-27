const http = require("http")
const {
    UnauthorizedError,
    NotFoundError,
    ConflictError,
    AppError
} = require("../errors")

const KEYCLOAK_URL = process.env.KEYCLOAK_URL
const REALM = process.env.KEYCLOAK_REALM
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET
const ADMIN_USER = process.env.KEYCLOAK_ADMIN
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD

// Helper para hacer peticiones HTTP crudas
function fetchRequest(method, url, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const bodyStr = body
            ? (typeof body === "string" ? body : JSON.stringify(body))
            : null
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

// Obtiene token de administrador (reutilizado internamente)
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

// ---------- Funciones públicas ----------

async function loginUser(username, password) {
    const body = `grant_type=password&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&username=${username}&password=${password}`
    const response = await fetchRequest(
        "POST",
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        body,
        { "Content-Type": "application/x-www-form-urlencoded" }
    )

    if (response.status !== 200) {
        throw new UnauthorizedError("Invalid credentials")
    }

    return JSON.parse(response.body) // { access_token, refresh_token, ... }
}

async function createKeycloakUser({ username, email, password }) {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "POST",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
        JSON.stringify({
            username,
            email,
            enabled: true,
            emailVerified: true,
            credentials: [{ type: "password", value: password, temporary: false }]
        }),
        {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        }
    )

    if (response.status === 409) {
        throw new ConflictError("User already exists")
    }

    if (response.status !== 201) {
        throw new AppError(`Keycloak user creation failed (status ${response.status})`, response.status)
    }
    // Éxito, no es necesario devolver datos
}

async function findKeycloakUserByUsername(username) {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "GET",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}&exact=true`,
        null,
        { "Authorization": `Bearer ${adminToken}` }
    )

    if (response.status !== 200) {
        throw new AppError(`Failed to fetch user by username (status ${response.status})`, response.status)
    }

    return JSON.parse(response.body) // array (puede estar vacío)
}

async function getKeycloakClient() {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "GET",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/clients`,
        null,
        { "Authorization": `Bearer ${adminToken}` }
    )

    if (response.status !== 200) {
        throw new AppError(`Failed to fetch clients (status ${response.status})`, response.status)
    }

    const clients = JSON.parse(response.body)
    const client = clients.find(c => c.clientId === CLIENT_ID)

    if (!client) {
        throw new AppError("Client not found in Keycloak", 500)
    }

    return client
}

async function getClientRole(clientId, roleName) {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "GET",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientId}/roles/${roleName}`,
        null,
        { "Authorization": `Bearer ${adminToken}` }
    )

    if (response.status === 404) {
        throw new NotFoundError(`Role '${roleName}' not found`)
    }

    if (response.status !== 200) {
        throw new AppError(`Failed to get client role (status ${response.status})`, response.status)
    }

    return JSON.parse(response.body)
}

async function assignClientRole(userId, clientId, role) {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "POST",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/clients/${clientId}`,
        JSON.stringify([{ id: role.id, name: role.name }]),
        {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        }
    )

    if (response.status !== 204) {
        throw new AppError(`Failed to assign client role (status ${response.status})`, response.status)
    }
}

async function getAllKeycloakUsers() {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "GET",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
        null,
        { "Authorization": `Bearer ${adminToken}` }
    )

    if (response.status !== 200) {
        throw new AppError(`Failed to fetch users (status ${response.status})`, response.status)
    }

    return JSON.parse(response.body)
}

async function updateKeycloakUser(userId, payload) {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "PUT",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`,
        JSON.stringify(payload),
        {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        }
    )

    if (response.status === 404) {
        throw new NotFoundError("User not found in Keycloak")
    }

    if (response.status !== 204) {
        throw new AppError(`Keycloak user update failed (status ${response.status})`, response.status)
    }
}

async function deleteKeycloakUser(userId) {
    const adminToken = await getAdminToken()
    const response = await fetchRequest(
        "DELETE",
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`,
        null,
        { "Authorization": `Bearer ${adminToken}` }
    )

    if (response.status === 404) {
        throw new NotFoundError("User not found in Keycloak")
    }

    if (response.status !== 204) {
        throw new AppError(`Keycloak user deletion failed (status ${response.status})`, response.status)
    }
}

async function getPublicCerts() {
    const response = await fetchRequest(
        "GET",
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`
    )

    if (response.status !== 200) {
        throw new AppError(`Failed to fetch public certs (status ${response.status})`, response.status)
    }

    return JSON.parse(response.body)
}

module.exports = {
    loginUser,
    createKeycloakUser,
    findKeycloakUserByUsername,
    getKeycloakClient,
    getClientRole,
    assignClientRole,
    getAllKeycloakUsers,
    updateKeycloakUser,
    deleteKeycloakUser,
    getPublicCerts
}