const DAOFactory = require("../dao/DAOFactory")
const orderDAO = DAOFactory.getOrderDAO()
const { BadRequestError, NotFoundError } = require("../errors")

class OrderService {
    async getAll() {
        return await orderDAO.getAll()
    }

    async getById(id) {
        const order = await orderDAO.getById(id)
        if (!order) {
            throw new NotFoundError("Order not found")
        }
        return order
    }

    async create(data) {
        if (!data.items || data.items.length === 0) {
            throw new BadRequestError("Order must have at least one item")
        }
        return await orderDAO.create(data)
    }

    async update(id, data) {
        await this.getById(id) 
        return await orderDAO.update(id, data)
    }

    async delete(id) {
        await this.getById(id)
        await orderDAO.delete(id)
    }
}

module.exports = new OrderService()