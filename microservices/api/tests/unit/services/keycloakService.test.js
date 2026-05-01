// tests/unit/services/keycloakService.test.js

const {
    UnauthorizedError,
    NotFoundError,
    ConflictError,
    AppError
} = require("../../../src/errors")

describe("KeycloakService", () => {

    let keycloakService
    let mockRequest
    let mockResponse
    let mockHttp

    beforeEach(() => {
        jest.resetModules()

        mockResponse = {
            statusCode: 200,
            on: jest.fn((event, callback) => {
                if (event === "data") callback(JSON.stringify({ access_token: "mock-token" }))
                if (event === "end") callback()
            })
        }

        mockRequest = {
            on: jest.fn(),
            write: jest.fn(),
            end: jest.fn()
        }

        mockHttp = {
            request: jest.fn((options, callback) => {
                callback(mockResponse)
                return mockRequest
            })
        }

        jest.doMock("http", () => mockHttp)

        process.env.KEYCLOAK_URL = "http://keycloak:8080"
        process.env.KEYCLOAK_REALM = "myrealm"
        process.env.KEYCLOAK_CLIENT_ID = "myclient"
        process.env.KEYCLOAK_CLIENT_SECRET = "mysecret"
        process.env.KEYCLOAK_ADMIN = "admin"
        process.env.KEYCLOAK_ADMIN_PASSWORD = "adminpass"

        keycloakService = require("../../../src/services/keycloakService")
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    // Helper: configura una única respuesta
    function setupResponse(statusCode, body) {
        mockResponse.statusCode = statusCode
        mockResponse.on.mockImplementation((event, callback) => {
            if (event === "data") callback(typeof body === "string" ? body : JSON.stringify(body))
            if (event === "end") callback()
        })
    }

    // Helper: configura múltiples respuestas secuenciales
    function setupMultipleResponses(responses) {
        let callCount = 0
        mockHttp.request.mockImplementation((options, callback) => {
            callCount++
            const response = responses[callCount - 1] || { statusCode: 200, body: {} }
            const res = {
                statusCode: response.statusCode,
                on: jest.fn((event, cb) => {
                    if (event === "data") cb(JSON.stringify(response.body))
                    if (event === "end") cb()
                })
            }
            callback(res)
            return mockRequest
        })
    }

    describe("loginUser", () => {
        it("retorna tokens si las credenciales son válidas", async () => {
            const tokens = { access_token: "abc", refresh_token: "def" }
            setupResponse(200, tokens)

            const result = await keycloakService.loginUser("user", "pass")

            expect(result).toEqual(tokens)
        })

        it("envía body como string (x-www-form-urlencoded)", async () => {
            setupResponse(200, { access_token: "token" })

            await keycloakService.loginUser("user", "pass")

            const writtenBody = mockRequest.write.mock.calls[0][0]
            expect(typeof writtenBody).toBe("string")
            expect(writtenBody).toContain("grant_type=password")
            expect(writtenBody).toContain("username=user")
        })

        it("lanza UnauthorizedError si las credenciales son inválidas (401)", async () => {
            setupResponse(401, { error: "invalid_grant" })

            await expect(keycloakService.loginUser("user", "wrong"))
                .rejects
                .toThrow("Invalid credentials")
        })
    })

    describe("createKeycloakUser", () => {
        it("crea usuario exitosamente", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 201, body: {} }
            ])

            await keycloakService.createKeycloakUser({
                username: "newuser",
                email: "new@test.com",
                password: "secret"
            })

            expect(mockHttp.request).toHaveBeenCalledTimes(2)
            const [secondOptions] = mockHttp.request.mock.calls[1]
            expect(secondOptions.method).toBe("POST")
            expect(secondOptions.path).toBe("/admin/realms/myrealm/users")
        })

        it("lanza ConflictError si el usuario ya existe (409)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 409, body: {} }
            ])

            await expect(keycloakService.createKeycloakUser({
                username: "existing",
                email: "exist@example.com",
                password: "pass"
            })).rejects.toThrow("User already exists")
        })

        it("lanza AppError si Keycloak responde con error inesperado", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 500, body: { error: "internal" } }
            ])

            await expect(keycloakService.createKeycloakUser({
                username: "user",
                email: "user@example.com",
                password: "pass"
            })).rejects.toThrow("Keycloak user creation failed (status 500)")
        })
    })

    describe("findKeycloakUserByUsername", () => {
        it("retorna array de usuarios encontrados", async () => {
            const users = [{ id: "1", username: "john" }]
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 200, body: users }
            ])

            const result = await keycloakService.findKeycloakUserByUsername("john")

            expect(result).toEqual(users)
            expect(mockHttp.request).toHaveBeenCalledTimes(2)
            const [secondOptions] = mockHttp.request.mock.calls[1]
            expect(secondOptions.method).toBe("GET")
            expect(secondOptions.path).toBe("/admin/realms/myrealm/users?username=john&exact=true")
        })

        it("lanza AppError si falla la búsqueda", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 403, body: { error: "forbidden" } }
            ])

            await expect(keycloakService.findKeycloakUserByUsername("john"))
                .rejects
                .toThrow("Failed to fetch user by username (status 403)")
        })
    })

    describe("getKeycloakClient", () => {
        it("retorna el cliente encontrado", async () => {
            const clients = [{ clientId: "myclient", id: "client-1" }]
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 200, body: clients }
            ])

            const result = await keycloakService.getKeycloakClient()

            expect(result).toEqual(clients[0])
        })

        it("lanza AppError si falla al obtener clients (status 500)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 500, body: { error: "internal" } }
            ])

            await expect(keycloakService.getKeycloakClient())
                .rejects
                .toThrow("Failed to fetch clients (status 500)")
        })

        it("lanza AppError si el cliente no está en la lista", async () => {
            const clients = [{ clientId: "otherclient", id: "client-2" }]
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 200, body: clients }
            ])

            await expect(keycloakService.getKeycloakClient())
                .rejects
                .toThrow("Client not found in Keycloak")
        })
    })

    describe("getClientRole", () => {
        it("retorna el rol encontrado", async () => {
            const role = { id: "role-1", name: "admin" }
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 200, body: role }
            ])

            const result = await keycloakService.getClientRole("client-1", "admin")

            expect(result).toEqual(role)
        })

        it("lanza NotFoundError si el rol no existe (404)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 404, body: { error: "not found" } }
            ])

            await expect(keycloakService.getClientRole("client-1", "nonexistent"))
                .rejects
                .toThrow("Role 'nonexistent' not found")
        })

        it("lanza AppError si falla al obtener el rol (status inesperado)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 403, body: { error: "forbidden" } }
            ])

            await expect(keycloakService.getClientRole("client-1", "admin"))
                .rejects
                .toThrow("Failed to get client role (status 403)")
        })
    })

    describe("assignClientRole", () => {
        it("asigna rol exitosamente", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 204, body: {} }
            ])

            await keycloakService.assignClientRole("user-1", "client-1", {
                id: "role-1",
                name: "admin"
            })

            expect(mockHttp.request).toHaveBeenCalledTimes(2)
            const [secondOptions] = mockHttp.request.mock.calls[1]
            expect(secondOptions.method).toBe("POST")
            expect(secondOptions.path).toBe("/admin/realms/myrealm/users/user-1/role-mappings/clients/client-1")
        })

        it("lanza AppError si falla la asignación", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 400, body: { error: "bad request" } }
            ])

            await expect(keycloakService.assignClientRole("user-1", "client-1", {
                id: "role-1",
                name: "admin"
            })).rejects.toThrow("Failed to assign client role (status 400)")
        })
    })

    describe("getAllKeycloakUsers", () => {
        it("retorna todos los usuarios", async () => {
            const users = [{ id: "1" }, { id: "2" }]
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 200, body: users }
            ])

            const result = await keycloakService.getAllKeycloakUsers()

            expect(result).toEqual(users)
        })

        it("lanza AppError si falla al obtener usuarios", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 503, body: { error: "unavailable" } }
            ])

            await expect(keycloakService.getAllKeycloakUsers())
                .rejects
                .toThrow("Failed to fetch users (status 503)")
        })
    })

    describe("updateKeycloakUser", () => {
        it("actualiza usuario exitosamente", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 204, body: {} }
            ])

            const payload = { email: "new@example.com" }
            await keycloakService.updateKeycloakUser("user-1", payload)

            expect(mockHttp.request).toHaveBeenCalledTimes(2)
            const [secondOptions] = mockHttp.request.mock.calls[1]
            expect(secondOptions.method).toBe("PUT")
            expect(secondOptions.path).toBe("/admin/realms/myrealm/users/user-1")
        })

        it("lanza NotFoundError si el usuario no existe (404)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 404, body: { error: "not found" } }
            ])

            await expect(keycloakService.updateKeycloakUser("user-1", {}))
                .rejects
                .toThrow("User not found in Keycloak")
        })

        it("lanza AppError si falla la actualización (status inesperado)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 500, body: { error: "internal" } }
            ])

            await expect(keycloakService.updateKeycloakUser("user-1", { email: "test@test.com" }))
                .rejects
                .toThrow("Keycloak user update failed (status 500)")
        })
    })

    describe("deleteKeycloakUser", () => {
        it("elimina usuario exitosamente", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 204, body: {} }
            ])

            await keycloakService.deleteKeycloakUser("user-1")

            expect(mockHttp.request).toHaveBeenCalledTimes(2)
            const [secondOptions] = mockHttp.request.mock.calls[1]
            expect(secondOptions.method).toBe("DELETE")
            expect(secondOptions.path).toBe("/admin/realms/myrealm/users/user-1")
        })

        it("lanza NotFoundError si el usuario no existe (404)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 404, body: { error: "not found" } }
            ])

            await expect(keycloakService.deleteKeycloakUser("user-1"))
                .rejects
                .toThrow("User not found in Keycloak")
        })

        it("lanza AppError si falla la eliminación (status inesperado)", async () => {
            setupMultipleResponses([
                { statusCode: 200, body: { access_token: "admin-token" } },
                { statusCode: 403, body: { error: "forbidden" } }
            ])

            await expect(keycloakService.deleteKeycloakUser("user-1"))
                .rejects
                .toThrow("Keycloak user deletion failed (status 403)")
        })
    })

    describe("getPublicCerts", () => {
        it("retorna certificados públicos", async () => {
            const certs = { keys: [{ kid: "key-1" }] }
            setupResponse(200, certs)

            const result = await keycloakService.getPublicCerts()

            expect(result).toEqual(certs)
            expect(mockHttp.request).toHaveBeenCalledTimes(1)
            const [options] = mockHttp.request.mock.calls[0]
            expect(options.method).toBe("GET")
            expect(options.path).toBe("/realms/myrealm/protocol/openid-connect/certs")
        })

        it("lanza AppError si falla", async () => {
            setupResponse(500, { error: "server error" })

            await expect(keycloakService.getPublicCerts())
                .rejects
                .toThrow("Failed to fetch public certs (status 500)")
        })
        
    })

})