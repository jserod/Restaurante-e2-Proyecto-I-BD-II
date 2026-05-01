const requireRole = require("../../../src/middlewares/requireRole")

describe("requireRole", () => {
    let req, res, next

    beforeEach(() => {
        req = {
            kauth: {
                grant: {
                    access_token: {
                        content: {
                            resource_access: {
                                "restaurant-api": {
                                    roles: ["admin"]
                                }
                            },
                            realm_access: {
                                roles: []
                            }
                        }
                    }
                }
            }
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        next = jest.fn()
    })

    test("permite acceso si el usuario tiene el rol requerido en client roles", () => {
        requireRole("admin")(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    test("permite acceso si el usuario tiene el rol en realm roles", () => {
        req.kauth.grant.access_token.content.resource_access = {}
        req.kauth.grant.access_token.content.realm_access = { roles: ["admin"] }

        requireRole("admin")(req, res, next)

        expect(next).toHaveBeenCalled()
    })

    test("retorna 403 si el usuario no tiene el rol requerido", () => {
        requireRole("superadmin")(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" })
        expect(next).not.toHaveBeenCalled()
    })

    test("retorna 401 si no hay token", () => {
        req.kauth = undefined

        requireRole("admin")(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" })
        expect(next).not.toHaveBeenCalled()
    })

    test("retorna 401 si resource_access no existe", () => {
        req.kauth.grant.access_token.content.resource_access = undefined
        req.kauth.grant.access_token.content.realm_access = undefined

        requireRole("admin")(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" })
    })

    test("funciona con rol client", () => {
        requireRole("client")(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
    })
})