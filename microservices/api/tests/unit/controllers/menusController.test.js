// tests/unit/controllers/menusController.test.js

const { createMockReq, createMockRes, createMockNext } = require("../../helpers/mockExpress")

describe("MenusController", () => {
    let menusController
    let menuService

    beforeEach(() => {
        jest.resetModules()

        menuService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            getByRestaurant: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }

        jest.doMock("../../../src/services/MenuService", () => menuService)
        menusController = require("../../../src/controllers/menusController")
    })

    describe("getAllMenus", () => {
        it("retorna todos los menus", async () => {
            const menus = [{ id: 1, name: "Menu 1" }]
            menuService.getAll.mockResolvedValue(menus)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await menusController.getAllMenus(req, res, next)

            expect(menuService.getAll).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(menus)
        })

        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            menuService.getAll.mockRejectedValue(error)

            const req = createMockReq()
            const res = createMockRes()
            const next = createMockNext()

            await menusController.getAllMenus(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getMenuById", () => {
        it("retorna menu por id", async () => {
            const menu = { id: 1, name: "Menu 1" }
            menuService.getById.mockResolvedValue(menu)

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.getMenuById(req, res, next)

            expect(menuService.getById).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith(menu)
        })

        // LÍNEA 18: next(error) en getMenuById
        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            menuService.getById.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.getMenuById(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("getMenusByRestaurant", () => {
        it("retorna menus por restaurante", async () => {
            const menus = [{ id: 1, restaurantId: 10 }]
            menuService.getByRestaurant.mockResolvedValue(menus)

            const req = createMockReq({ params: { restaurantId: "10" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.getMenusByRestaurant(req, res, next)

            expect(menuService.getByRestaurant).toHaveBeenCalledWith("10")
            expect(res.json).toHaveBeenCalledWith(menus)
        })

        // LÍNEA 27: next(error) en getMenusByRestaurant
        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            menuService.getByRestaurant.mockRejectedValue(error)

            const req = createMockReq({ params: { restaurantId: "10" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.getMenusByRestaurant(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("createMenu", () => {
        it("crea menu con datos válidos", async () => {
            const created = { id: 1, restaurantId: 10, name: "Nuevo Menu" }
            menuService.create.mockResolvedValue(created)

            const req = createMockReq({
                body: { restaurantId: 10, name: "Nuevo Menu", description: "Desc" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.createMenu(req, res, next)

            expect(menuService.create).toHaveBeenCalledWith({
                restaurantId: 10,
                name: "Nuevo Menu",
                description: "Desc"
            })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith(created)
        })

        it("retorna 400 si falta restaurantId", async () => {
            const req = createMockReq({ body: { name: "Menu" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.createMenu(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "restaurantId and name are required" })
            expect(menuService.create).not.toHaveBeenCalled()
        })

        it("retorna 400 si falta name", async () => {
            const req = createMockReq({ body: { restaurantId: 10 } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.createMenu(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "restaurantId and name are required" })
        })

        // LÍNEA 40: next(error) en createMenu
        it("pasa errores a next", async () => {
            const error = new Error("DB fail")
            menuService.create.mockRejectedValue(error)

            const req = createMockReq({
                body: { restaurantId: 10, name: "Nuevo Menu" }
            })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.createMenu(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("updateMenu", () => {
        it("actualiza menu", async () => {
            const updated = { id: 1, name: "Updated" }
            menuService.update.mockResolvedValue(updated)

            const req = createMockReq({ params: { id: "1" }, body: { name: "Updated" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.updateMenu(req, res, next)

            expect(menuService.update).toHaveBeenCalledWith("1", { name: "Updated" })
            expect(res.json).toHaveBeenCalledWith(updated)
        })

        // LÍNEA 49: next(error) en updateMenu
        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            menuService.update.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" }, body: { name: "Updated" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.updateMenu(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe("deleteMenu", () => {
        it("elimina menu", async () => {
            menuService.delete.mockResolvedValue()

            const req = createMockReq({ params: { id: "1" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.deleteMenu(req, res, next)

            expect(menuService.delete).toHaveBeenCalledWith("1")
            expect(res.json).toHaveBeenCalledWith({ message: "Menu deleted" })
        })

        // LÍNEA 58: next(error) en deleteMenu
        it("pasa errores a next", async () => {
            const error = new Error("Not found")
            menuService.delete.mockRejectedValue(error)

            const req = createMockReq({ params: { id: "999" } })
            const res = createMockRes()
            const next = createMockNext()

            await menusController.deleteMenu(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})