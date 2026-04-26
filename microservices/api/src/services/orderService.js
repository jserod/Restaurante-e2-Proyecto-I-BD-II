const DAOFactory = require("../dao/DAOFactory")
const orderDAO = DAOFactory.getOrderDAO()

class OrderService {

    async getAll() {
        return await orderDAO.getAll()
    }

    async getById(id) {
        return await orderDAO.getById(id)
    }

    async create(data) {
        if (!data.items || data.items.length === 0) {
            throw new Error("Order must have at least one item")
        }

        return await orderDAO.create(data)
    }

    async update(id, data) {
        return await orderDAO.update(id, data)
    }

    async delete(id) {
        return await orderDAO.delete(id)
    }
}

module.exports = new OrderService()