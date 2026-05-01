const jwt = require("jsonwebtoken")
const keycloakProtectFactory = require("../../../src/middlewares/keycloakProtect")
const keycloakService = require("../../../src/services/keycloakService")

jest.mock("../../../src/services/keycloakService")
jest.mock("jsonwebtoken")
jest.mock("crypto", () => ({
    createPublicKey: jest.fn().mockReturnValue({
        export: jest.fn().mockReturnValue("-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----")
    })
}))

describe("keycloakProtect", () => {
    let req, res, next
    const mockCerts = {
        keys: [{ kid: "test-kid", kty: "RSA", n: "mock-n", e: "AQAB" }]
    }

    beforeEach(() => {
        req = {
            headers: {
                authorization: "Bearer valid.token.here"
            }
        }
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }
        next = jest.fn()
        jest.clearAllMocks()
        keycloakService.getPublicCerts.mockResolvedValue(mockCerts)
    })

    test("retorna 401 si no hay header de autorización", async () => {
        req.headers.authorization = undefined

        await keycloakProtectFactory()(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.send).toHaveBeenCalledWith("Access denied")
        expect(next).not.toHaveBeenCalled()
    })

    test("retorna 401 si el header no empieza con Bearer", async () => {
        req.headers.authorization = "Basic sometoken"

        await keycloakProtectFactory()(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.send).toHaveBeenCalledWith("Access denied")
    })

    test("retorna 401 si el token no se puede decodificar", async () => {
        jwt.decode.mockReturnValue(null)

        await keycloakProtectFactory()(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.send).toHaveBeenCalledWith("Access denied")
    })

    test("retorna 401 si el kid no coincide con ninguna clave", async () => {
        jwt.decode.mockReturnValue({
            header: { kid: "unknown-kid" },
            payload: {}
        })

        await keycloakProtectFactory()(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.send).toHaveBeenCalledWith("Access denied")
    })

    test("adjunta kauth y llama next con token válido", async () => {
        const mockPayload = {
            sub: "user-123",
            email: "test@test.com",
            preferred_username: "testuser"
        }

        jwt.decode.mockReturnValue({
            header: { kid: "test-kid" },
            payload: mockPayload
        })

        jwt.verify.mockReturnValue(mockPayload)

        await keycloakProtectFactory()(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(req.kauth).toBeDefined()
        expect(req.kauth.grant.access_token.content).toEqual(mockPayload)
    })

    test("retorna 401 si jwt.verify lanza error", async () => {
        jwt.decode.mockReturnValue({
            header: { kid: "test-kid" },
            payload: {}
        })

        jwt.verify.mockImplementation(() => {
            throw new Error("Token expired")
        })

        await keycloakProtectFactory()(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.send).toHaveBeenCalledWith("Access denied")
    })

    test("retorna 401 si getPublicCerts falla", async () => {
        jwt.decode.mockReturnValue({
            header: { kid: "test-kid" },
            payload: {}
        })

        keycloakService.getPublicCerts.mockRejectedValue(new Error("Keycloak down"))

        await keycloakProtectFactory()(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.send).toHaveBeenCalledWith("Access denied")
    })
})