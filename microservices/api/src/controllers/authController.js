const http = require("http")

const KEYCLOAK_URL = process.env.KEYCLOAK_URL
const REALM = process.env.KEYCLOAK_REALM
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET
const ADMIN_USER = process.env.KEYCLOAK_ADMIN
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD

function fetchPost(url, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const bodyStr = typeof body === "string" ? body : JSON.stringify(body)
        const urlObj = new URL(url)

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname,
            method: "POST",
            headers: {
                "Content-Length": Buffer.byteLength(bodyStr),
                ...headers
            }
        }

        const req = http.request(options, res => {
            let data = ""
            res.on("data", chunk => data += chunk)
            res.on("end", () => resolve({ status: res.statusCode, body: data }))
        })

        req.on("error", reject)
        req.write(bodyStr)
        req.end()
    })
}

function fetchGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url)

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname + (urlObj.search || ""),
            method: "GET",
            headers
        }

        const req = http.request(options, res => {
            let data = ""
            res.on("data", chunk => data += chunk)
            res.on("end", () => resolve({ status: res.statusCode, body: data }))
        })

        req.on("error", reject)
        req.end()
    })
}

async function getAdminToken() {
    const body = `grant_type=password&client_id=admin-cli&username=${ADMIN_USER}&password=${ADMIN_PASSWORD}`
    const res = await fetchPost(
        `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
        body,
        { "Content-Type": "application/x-www-form-urlencoded" }
    )
    const data = JSON.parse(res.body)
    return data.access_token
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: "username and password are required" })
        }

        const body = `grant_type=password&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&username=${username}&password=${password}`

        const response = await fetchPost(
            `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
            body,
            { "Content-Type": "application/x-www-form-urlencoded" }
        )

        const data = JSON.parse(response.body)

        if (response.status !== 200) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        res.json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in
        })
    } catch (error) {
        next(error)
    }
}

async function register(req, res, next) {
    try {
        const { username, email, password, role } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({ error: "username, email and password are required" })
        }

        const validRoles = ["user", "admin"]
        const assignedRole = validRoles.includes(role) ? role : "user"

        const adminToken = await getAdminToken()

        // crear usuario en keycloak
        const createRes = await fetchPost(
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

        if (createRes.status === 409) {
            return res.status(409).json({ error: "User already exists" })
        }

        if (createRes.status !== 201) {
            return res.status(400).json({ error: "Registration failed" })
        }

        // obtener el id del usuario recién creado
        const usersRes = await fetchGet(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}&exact=true`,
            { "Authorization": `Bearer ${adminToken}` }
        )

        const users = JSON.parse(usersRes.body)
        if (!users.length) {
            return res.status(500).json({ error: "User created but could not be found" })
        }

        const userId = users[0].id

        // obtener los roles del cliente restaurant-api
        const rolesRes = await fetchGet(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/clients`,
            { "Authorization": `Bearer ${adminToken}` }
        )

        const clients = JSON.parse(rolesRes.body)
        const client = clients.find(c => c.clientId === CLIENT_ID)

        if (!client) {
            return res.status(500).json({ error: "Client not found in Keycloak" })
        }

        // obtener el rol especifico del cliente
        const clientRolesRes = await fetchGet(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${client.id}/roles/${assignedRole}`,
            { "Authorization": `Bearer ${adminToken}` }
        )

        const roleObj = JSON.parse(clientRolesRes.body)

        // asignar el rol al usuario
        await fetchPost(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/clients/${client.id}`,
            JSON.stringify([{ id: roleObj.id, name: roleObj.name }]),
            {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            }
        )

        res.status(201).json({ message: "User registered successfully", username, role: assignedRole })
    } catch (error) {
        next(error)
    }
}

module.exports = { login, register }