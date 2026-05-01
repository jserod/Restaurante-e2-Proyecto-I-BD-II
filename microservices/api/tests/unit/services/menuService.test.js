const { NotFoundError } = require("../../../src/errors")

describe("MenuService", () => {

    let menuService
    let menuDAO

    beforeEach(() => {
        jest.resetModules()

        menuDAO = {
            getAll: jest.fn(),
            getById: jest.fn(),
            getByRestaurant: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/dao/DAOFactory", () => ({
            getMenuDAO: () => menuDAO
        }))

        menuService = require("../../../src/services/menuService")
    })

    describe("getAll", () => {
        it("retorna todos los menus", async () => {
            menuDAO.getAll.mockResolvedValue([{ id: 1 }])

            const result = await menuService.getAll()

            expect(result).toEqual([{ id: 1 }])
        })
    })

    describe("getById", () => {
        it("retorna menu si existe", async () => {
            menuDAO.getById.mockResolvedValue({ id: 1 })

            const result = await menuService.getById(1)

            expect(result).toEqual({ id: 1 })
        })

        it("lanza NotFoundError si no existe", async () => {
            menuDAO.getById.mockResolvedValue(null)

            await expect(menuService.getById(1))
                .rejects
                .toThrow("Menu not found")
        })
    })

    describe("create", () => {
        it("crea un menu", async () => {
            const data = { name: "Menu" }

            menuDAO.create.mockResolvedValue(data)

            const result = await menuService.create(data)

            expect(result).toEqual(data)
            expect(menuDAO.create).toHaveBeenCalledWith(data)
        })
    })

    describe("update", () => {
        it("actualiza si existe", async () => {
            menuDAO.getById.mockResolvedValue({ id: 1 })
            menuDAO.update.mockResolvedValue({ id: 1, name: "Updated" })

            const result = await menuService.update(1, { name: "Updated" })

            expect(menuDAO.update).toHaveBeenCalledWith(1, { name: "Updated" })
            expect(result).toEqual({ id: 1, name: "Updated" })
        })

        it("lanza error si no existe", async () => {
            menuDAO.getById.mockResolvedValue(null)

            await expect(menuService.update(1, {}))
                .rejects
                .toThrow("Menu not found")
        })
    })

    describe("delete", () => {
        it("elimina y retorna el menu", async () => {
            const menu = { id: 1 }

            menuDAO.getById.mockResolvedValue(menu)
            menuDAO.delete.mockResolvedValue()

            const result = await menuService.delete(1)

            expect(menuDAO.delete).toHaveBeenCalledWith(1)
            expect(result).toEqual(menu)
        })

        it("lanza error si no existe", async () => {
            menuDAO.getById.mockResolvedValue(null)

            await expect(menuService.delete(1))
                .rejects
                .toThrow("Menu not found")
        })
    })

    describe("getByRestaurant", () => {
        it("retorna menus por restaurante", async () => {
            const mockMenus = [{ id: 1, restaurantId: 10 }]

            menuDAO.getByRestaurant.mockResolvedValue(mockMenus)

            const result = await menuService.getByRestaurant(10)

            expect(menuDAO.getByRestaurant).toHaveBeenCalledWith(10)
            expect(result).toEqual(mockMenus)
        })
    })

})