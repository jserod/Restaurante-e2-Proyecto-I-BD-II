const DAOFactory = require("../dao/DAOFactory")
const productDAO = DAOFactory.getProductDAO()
const { NotFoundError } = require("../errors")

class ProductService {
    async getAll() {
        return await productDAO.getAll()
    }

    async getById(id) {
        const product = await productDAO.getById(id)
        if (!product) {
            throw new NotFoundError("Product not found")
        }
        return product
    }

    async create(data) {
        return await productDAO.create(data)
    }

    async update(id, data) {
        const product = await this.getById(id)
        return await productDAO.update(id, data)
    }

    async delete(id) {
        const product = await this.getById(id)
        await productDAO.delete(id)
        return product
    }
}

module.exports = new ProductService()