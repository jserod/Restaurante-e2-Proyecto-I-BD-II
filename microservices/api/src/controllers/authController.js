/**
 * @fileoverview Controlador de autenticación. Gestiona login y registro de usuarios via Keycloak.
 * Delega la lógica de negocio a keycloakService.
 */

const keycloakService = require("../services/keycloakService")
const { BadRequestError, AppError } = require("../errors")  

/**
 * Autentica un usuario con username y password contra Keycloak.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function login(req, res, next) {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            throw new BadRequestError("username and password are required")
        }

        const data = await keycloakService.loginUser(username, password)

        res.json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Registra un nuevo usuario en Keycloak con rol por defecto "user".
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function register(req, res, next) {
    try {
        const { username, email, password, role } = req.body

        if (!username || !email || !password) {
            throw new BadRequestError("username, email and password are required")
        }

        const validRoles = ["user", "admin"]
        const assignedRole = validRoles.includes(role) ? role : "user"

        await keycloakService.createKeycloakUser({ username, email, password })

        const users = await keycloakService.findKeycloakUserByUsername(username)
        if (!users.length) {
            throw new AppError("User created but could not be found", 500)
        }

        const keycloakClient = await keycloakService.getKeycloakClient()
        const roleObj = await keycloakService.getClientRole(keycloakClient.id, assignedRole)
        await keycloakService.assignClientRole(users[0].id, keycloakClient.id, roleObj)

        res.status(201).json({
            message: "User registered successfully",
            username,
            role: assignedRole
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    login,
    register
}