const { NotFoundError, AppError } = require("../../../src/errors")

describe("RestaurantService", () => {

    let restaurantService
    let restaurantDAO

    beforeEach(() => {
        jest.resetModules()

        restaurantDAO = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/dao/DAOFactory", () => ({
            getRestaurantDAO: () => restaurantDAO
        }))

        restaurantService = require("../../../src/services/restaurantService")
    })

    describe("getAll", () => {
        it("retorna todos los restaurantes", async () => {
            restaurantDAO.getAll.mockResolvedValue([{ id: 1 }])

            const result = await restaurantService.getAll()

            expect(result).toEqual([{ id: 1 }])
            expect(restaurantDAO.getAll).toHaveBeenCalled()
        })
    })

    describe("getById", () => {
        it("retorna restaurante si existe", async () => {
            restaurantDAO.getById.mockResolvedValue({ id: 1 })

            const result = await restaurantService.getById(1)

            expect(result).toEqual({ id: 1 })
            expect(restaurantDAO.getById).toHaveBeenCalledWith(1)
        })

        it("lanza NotFoundError si no existe", async () => {
            restaurantDAO.getById.mockResolvedValue(null)

            await expect(restaurantService.getById(1))
                .rejects
                .toThrow("Restaurant not found")
            expect(restaurantDAO.getById).toHaveBeenCalledWith(1)
        })
    })

    describe("create", () => {
        it("crea un restaurante", async () => {
            const data = { name: "Restaurante", description: "Desc", address: "Calle 1" }
            restaurantDAO.create.mockResolvedValue({ id: 1, ...data })

            const result = await restaurantService.create(data)

            expect(restaurantDAO.create).toHaveBeenCalledWith(data)
            expect(result).toEqual({ id: 1, ...data })
        })

        it("lanza AppError si no se proporciona el nombre", async () => {
            await expect(restaurantService.create({ description: "Desc" }))
                .rejects
                .toThrow("Name is required")
            expect(restaurantDAO.create).not.toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("actualiza si existe", async () => {
            restaurantDAO.getById.mockResolvedValue({ id: 1 })
            restaurantDAO.update.mockResolvedValue({ id: 1, name: "Updated" })

            const result = await restaurantService.update(1, { name: "Updated" })

            expect(restaurantDAO.getById).toHaveBeenCalledWith(1)
            expect(restaurantDAO.update).toHaveBeenCalledWith(1, { name: "Updated" })
            expect(result).toEqual({ id: 1, name: "Updated" })
        })

        it("lanza NotFoundError si no existe", async () => {
            restaurantDAO.getById.mockResolvedValue(null)

            await expect(restaurantService.update(1, { name: "Updated" }))
                .rejects
                .toThrow("Restaurant not found")
            expect(restaurantDAO.update).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        it("elimina si existe", async () => {
            restaurantDAO.getById.mockResolvedValue({ id: 1 })
            restaurantDAO.delete.mockResolvedValue()

            await restaurantService.delete(1)

            expect(restaurantDAO.getById).toHaveBeenCalledWith(1)
            expect(restaurantDAO.delete).toHaveBeenCalledWith(1)
        })

        it("lanza NotFoundError si no existe", async () => {
            restaurantDAO.getById.mockResolvedValue(null)

            await expect(restaurantService.delete(1))
                .rejects
                .toThrow("Restaurant not found")
            expect(restaurantDAO.delete).not.toHaveBeenCalled()
        })
    })

})