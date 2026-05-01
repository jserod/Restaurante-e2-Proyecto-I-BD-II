describe("UserService", () => {
    let userService
    let userDAO
    let NotFoundError

    beforeEach(() => {
        jest.resetModules()

        userDAO = {
            getUserByKeycloakId: jest.fn(),
            getUserByEmail: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            getAllUsers: jest.fn(),
            getUserById: jest.fn(),
            deleteUser: jest.fn()
        }

        jest.doMock("../../../src/dao/DAOFactory", () => ({
            getUserDAO: () => userDAO
        }))

        userService = require("../../../src/services/userService")
        NotFoundError = require("../../../src/errors").NotFoundError
    })

    describe("findOrCreateUser", () => {
        it("retorna usuario si ya existe por keycloakId", async () => {
            const existingUser = { id: 1 }
            userDAO.getUserByKeycloakId.mockResolvedValue(existingUser)

            const result = await userService.findOrCreateUser({
                keycloakId: "kc1",
                email: "test@mail.com",
                name: "Test"
            })

            expect(result).toEqual(existingUser)
            expect(userDAO.getUserByEmail).not.toHaveBeenCalled()
        })

        it("actualiza usuario si existe por email", async () => {
            const existingUser = { id: 1 }
            userDAO.getUserByKeycloakId.mockResolvedValue(null)
            userDAO.getUserByEmail.mockResolvedValue(existingUser)
            userDAO.updateUser.mockResolvedValue({ ...existingUser, name: "Nuevo" })

            const result = await userService.findOrCreateUser({
                keycloakId: "kc1",
                email: "test@mail.com",
                name: "Nuevo"
            })

            expect(userDAO.updateUser).toHaveBeenCalledWith(1, {
                name: "Nuevo",
                email: "test@mail.com"
            })
            expect(result).toEqual({ ...existingUser, name: "Nuevo" })
        })

        it("crea usuario si no existe", async () => {
            userDAO.getUserByKeycloakId.mockResolvedValue(null)
            userDAO.getUserByEmail.mockResolvedValue(null)
            const newUser = { id: 1 }
            userDAO.createUser.mockResolvedValue(newUser)

            const result = await userService.findOrCreateUser({
                keycloakId: "kc1",
                email: "test@mail.com",
                name: "Test"
            })

            expect(userDAO.createUser).toHaveBeenCalledWith({
                keycloakId: "kc1",
                email: "test@mail.com",
                name: "Test"
            })
            expect(result).toEqual(newUser)
        })
    })

    describe("getAllUsers", () => {
        it("retorna todos los usuarios", async () => {
            userDAO.getAllUsers.mockResolvedValue([{ id: 1 }])

            const result = await userService.getAllUsers()

            expect(result).toEqual([{ id: 1 }])
        })
    })

    describe("getUserById", () => {
        it("retorna usuario si existe", async () => {
            userDAO.getUserById.mockResolvedValue({ id: 1 })

            const result = await userService.getUserById(1)

            expect(result).toEqual({ id: 1 })
        })

        it("lanza NotFoundError si no existe", async () => {
            userDAO.getUserById.mockResolvedValue(null)

            await expect(userService.getUserById(1))
                .rejects
                .toThrow(NotFoundError)
        })
    })

    describe("updateUser", () => {
        it("actualiza usuario si existe", async () => {
            const user = { id: 1 }
            userDAO.getUserByKeycloakId.mockResolvedValue(user)
            userDAO.updateUser.mockResolvedValue({ ...user, name: "Nuevo" })

            const result = await userService.updateUser("kc1", { name: "Nuevo" })

            expect(userDAO.updateUser).toHaveBeenCalledWith(1, { name: "Nuevo" })
            expect(result).toEqual({ ...user, name: "Nuevo" })
        })

        it("lanza NotFoundError si no existe", async () => {
            userDAO.getUserByKeycloakId.mockResolvedValue(null)

            await expect(userService.updateUser("kc1", {}))
                .rejects
                .toThrow(NotFoundError)
        })
    })

    describe("deleteUser", () => {
        it("elimina usuario si existe", async () => {
            userDAO.getUserById.mockResolvedValue({ id: 1 })
            userDAO.deleteUser.mockResolvedValue()

            await userService.deleteUser(1)

            expect(userDAO.deleteUser).toHaveBeenCalledWith(1)
        })

        it("lanza NotFoundError si no existe", async () => {
            userDAO.getUserById.mockResolvedValue(null)

            await expect(userService.deleteUser(1))
                .rejects
                .toThrow(NotFoundError)
        })
    })
})