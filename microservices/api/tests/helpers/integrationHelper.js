// tests/helpers/integrationHelper.js
const express = require("express")
const request = require("supertest")

/**
 * Crea una app Express mínima con los middlewares de auth mockeados
 * y monta las routes dadas
 */
function createTestApp(routePath, routeModule) {
    const app = express()
    app.use(express.json())

    // Mock de middlewares de auth ANTES de cargar routes
    jest.doMock("../../src/middlewares/keycloakProtect", () => {
        return () => (req, res, next) => next()
    })

    jest.doMock("../../src/middlewares/attachUser", () => {
        return (req, res, next) => {
            req.user = { id: "test-user-id", roles: ["admin"] }
            req.kauth = {
                grant: {
                    access_token: {
                        content: {
                            sub: "test-keycloak-id",
                            email: "test@test.com",
                            preferred_username: "testuser",
                            resource_access: { "restaurant-api": { roles: ["admin"] } },
                            realm_access: { roles: ["admin"] }
                        }
                    }
                }
            }
            next()
        }
    })

    jest.doMock("../../src/middlewares/requireRole", () => {
        return () => (req, res, next) => next()
    })

    // Mock de cache middlewares
    jest.doMock("../../src/middlewares/cache", () => ({
        cache: () => (req, res, next) => next(),
        invalidateCache: jest.fn(),
        invalidateOnSuccess: () => (req, res, next) => next()
    }))

    app.use(routePath, routeModule)

    // Error handler mínimo
    app.use((err, req, res, next) => {
        console.error(err)
        res.status(err.statusCode || 500).json({ error: err.message || "Internal server error" })
    })

    return app
}

module.exports = { createTestApp }